#!/usr/bin/env bash
# Release train: the cut.
#
# The same file lives in binectics-api, binectics-frontend and
# binectics-mobile, next to release-cut.test.sh. Change all three together;
# run `bash .github/scripts/release-cut.test.sh` after any change.
#
#   release-cut.sh status        is there anything on main that release lacks?
#   release-cut.sh cut           fast-forward `release` to `main` and tag it
#   release-cut.sh notes         write (or rewrite) the GitHub Release for TAG
#   release-cut.sh watch-out N   print the Watch out lines of PR N's body,
#                                read from stdin
#
# Runs on a GitHub runner with nothing but git, gh and python3: no npm
# install. Inputs come from the environment:
#
#   GITHUB_REPOSITORY  owner/name (set by Actions)
#   GH_TOKEN           the job's GITHUB_TOKEN (contents: write,
#                      pull-requests: read)
#   FALLBACK_TOKEN     optional, secrets.RELEASE_TRAIN_TOKEN (see below)
#   CUT_SHA            cut only, optional: cut at this commit of main instead
#                      of main's head (the commit a guard step approved)
#   TAG, PREV_TAG, SHA notes only: the outputs of the cut step
#   PRERELEASE         notes only, optional: "true" creates the Release as a
#                      pre-release, for a later step to promote
#   EXTRA_NOTES        notes only, optional: a line added to the Release
#
# Reruns are safe. If release already holds main, the cut moves nothing; it
# tags the head if no release tag points at it, and asks for the notes again
# if that tag has no GitHub Release yet (a run that died half-way).
#
# Why a fallback token: GitHub refuses to let GITHUB_TOKEN move a ref when
# the move brings in a change to a file under .github/workflows/ ("refusing
# to allow a GitHub App to create or update workflow"). GITHUB_TOKEN cannot
# be given that permission. The push retries with RELEASE_TRAIN_TOKEN when
# GitHub refuses for that reason, and fails loudly when the secret is unset.
#
# Tokens never go in a URL: each git call gets an Authorization header
# through `-c http.https://github.com/.extraheader=...`.
set -euo pipefail

: "${GITHUB_REPOSITORY:?}" "${GH_TOKEN:?}"
REPO_URL="https://github.com/${GITHUB_REPOSITORY}.git"

out() { echo "$1=$2" >> "${GITHUB_OUTPUT:-/dev/stdout}"; }
summary() { echo "$*" >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"; }

# git with a token, without writing it into the URL or the repo config.
authed_git() {
  local token=$1 basic
  shift
  basic=$(printf 'x-access-token:%s' "$token" | base64 | tr -d '\n')
  if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::add-mask::$basic"; fi
  git -c http.https://github.com/.extraheader= \
      -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $basic" "$@"
}

# The sha of branch $1 on GitHub, or nothing. Exact match: ls-remote's own
# pattern also matches suffixes such as refs/heads/chore/release.
remote_head() {
  authed_git "$GH_TOKEN" ls-remote "$REPO_URL" "refs/heads/$1" \
    | awk -v want="refs/heads/$1" '$2 == want { print $1 }'
}

# Push with GITHUB_TOKEN; fall back to RELEASE_TRAIN_TOKEN only when GitHub
# refused because of a workflow-file change.
push_refs() {
  local err
  err=$(mktemp)
  if authed_git "$GH_TOKEN" push --atomic --quiet "$REPO_URL" "$@" 2>"$err"; then
    return 0
  fi
  cat "$err" >&2
  if grep -q 'refusing to allow' "$err"; then
    if [ -n "${FALLBACK_TOKEN:-}" ]; then
      echo "GITHUB_TOKEN may not move refs across a workflow-file change. Retrying with RELEASE_TRAIN_TOKEN."
      authed_git "$FALLBACK_TOKEN" push --atomic --quiet "$REPO_URL" "$@"
      return
    fi
    echo "::error title=Release train blocked::A PR merged since the last release changed a file under .github/workflows/, and GITHUB_TOKEN is not allowed to move a branch across that. Add the RELEASE_TRAIN_TOKEN repository secret (a fine-grained token with Contents, Workflows and Actions read/write on the three Binectics repos), then run the Release train workflow again."
  fi
  return 1
}

has_release() { gh release view "$1" --repo "$GITHUB_REPOSITORY" >/dev/null 2>&1; }

# The next free release-YYYY-MM-DD[-n] tag name.
next_tag() {
  local day tag n
  day=$(date -u +%Y-%m-%d)
  tag="release-$day"
  n=1
  while git rev-parse --quiet --verify "refs/tags/$tag" >/dev/null; do
    n=$((n + 1))
    tag="release-$day-$n"
  done
  echo "$tag"
}

cmd_status() {
  local main_sha release_sha
  main_sha=$(remote_head main)
  release_sha=$(remote_head release)
  out main_sha "$main_sha"
  out release_sha "$release_sha"
  if [ -n "$main_sha" ] && [ "$main_sha" = "$release_sha" ]; then
    echo "main and release are both at $main_sha."
    out pending false
  else
    echo "main is at $main_sha, release at ${release_sha:-<none>}: there is something to cut."
    out pending true
  fi
}

cmd_cut() {
  local main_sha target release_sha prev_tag tag
  authed_git "$GH_TOKEN" fetch --quiet --force --tags "$REPO_URL" '+refs/heads/main:refs/remotes/origin/main'
  main_sha=$(git rev-parse refs/remotes/origin/main)
  target=${CUT_SHA:-$main_sha}
  if ! git merge-base --is-ancestor "$target" "$main_sha" 2>/dev/null; then
    echo "::error::CUT_SHA $target is not a commit on main."
    exit 1
  fi

  release_sha=$(remote_head release)
  if [ -n "$release_sha" ]; then
    authed_git "$GH_TOKEN" fetch --quiet "$REPO_URL" '+refs/heads/release:refs/remotes/origin/release'
  fi

  # Nothing new: release already holds the commit to cut.
  if [ -n "$release_sha" ] && git merge-base --is-ancestor "$target" "$release_sha"; then
    out sha "$release_sha"
    out cut false
    tag=$(git tag --points-at "$release_sha" --list 'release-*' | sort -V | tail -1)
    prev_tag=$(git describe --tags --abbrev=0 --match 'release-*' "$release_sha^" 2>/dev/null || true)
    if [ -z "$tag" ]; then
      tag=$(next_tag)
      git tag "$tag" "$release_sha"
      push_refs "refs/tags/$tag"
      echo "release ($release_sha) had no release tag; tagged it $tag."
      out notes true
    elif ! has_release "$tag"; then
      echo "Nothing new to release, but $tag has no GitHub Release yet; writing it."
      out notes true
    else
      echo "main has nothing that release ($release_sha, $tag) lacks. Nothing to release."
      summary "Nothing to release: \`release\` is at \`$release_sha\` ($tag)."
      out notes false
    fi
    out tag "$tag"
    out prev_tag "$prev_tag"
    return 0
  fi

  prev_tag=""
  if [ -n "$release_sha" ]; then
    if ! git merge-base --is-ancestor "$release_sha" "$target"; then
      echo "::error title=release has diverged from main::release ($release_sha) is not an ancestor of main ($target), so it cannot be fast-forwarded. Someone committed to release directly. Get those commits onto main through a PR (then the next run fast-forwards), or, if they are unwanted, ask the owner to reset release to the last release tag. The train never force-pushes."
      exit 1
    fi
    prev_tag=$(git describe --tags --abbrev=0 --match 'release-*' "$release_sha" 2>/dev/null || true)
  else
    echo "No release branch yet. This first run creates it from main."
  fi

  tag=$(next_tag)
  git tag "$tag" "$target"
  # Atomic: the branch and the tag move together or not at all. No force, so
  # GitHub itself also rejects anything but a fast-forward.
  push_refs "$target:refs/heads/release" "refs/tags/$tag"

  echo "release fast-forwarded ${release_sha:-<new>} -> $target and tagged $tag."
  summary "Cut \`$tag\` at \`$target\` (previous release: ${prev_tag:-none})."
  out sha "$target"
  out cut true
  out notes true
  out tag "$tag"
  out prev_tag "$prev_tag"
}

# Lines under a "Watch out" heading in a PR body (stdin), up to the next
# heading outside a code fence. HTML comments are dropped, wrapped lines are
# joined, and @mentions are put in backticks so the Release pings nobody.
cmd_watch_out() {
  python3 -c '
import re, sys
num = sys.argv[1]
text = sys.stdin.read().replace("\r\n", "\n").replace("\r", "\n")
text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
text = re.sub(r"<!--.*\Z", "", text, flags=re.S)
head = re.compile(r"^\s{0,3}(#{1,6}\s*)?(\*\*|__)?\s*watch out\s*:?\s*(\*\*|__)?\s*:?\s*$", re.I)
other = re.compile(r"^\s{0,3}(#{1,6}(\s|$)|(\*\*|__)[^*_]+(\*\*|__)\s*:?\s*$)")
fence = re.compile(r"^\s{0,3}(```|~~~)")
bullet = re.compile(r"^\s*([-*+]|\d+[.)])\s+")
mention = re.compile(r"(?<![\w`/.@])@([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:/[A-Za-z0-9._-]+)?)")
items, cur, on, in_fence = [], None, False, False
def add(s, new):
    global cur
    if new or cur is None:
        items.append(s)
        cur = len(items) - 1
    else:
        items[cur] += " " + s
for line in text.split("\n"):
    if fence.match(line):
        in_fence = not in_fence
        continue
    if not in_fence:
        if head.match(line):
            on, cur = True, None
            continue
        if on and other.match(line):
            on, cur = False, None
    if not on:
        continue
    if not line.strip():
        if not in_fence:
            cur = None
        continue
    if in_fence:
        add(line.strip(), False)
        continue
    m = bullet.match(line)
    add(bullet.sub("", line, count=1).strip() if m else line.strip(), bool(m))
for it in items:
    if it.lower().rstrip(".") in {"none", "n/a", "na", "nothing", "-", ""}:
        continue
    it = mention.sub(lambda m: "`@" + m.group(1) + "`", it)
    print("- " + it + " (#" + num + ")")
' "$1"
}

cmd_notes() {
  : "${TAG:?}" "${SHA:?}"
  local notes generated watch prs n
  notes=$(mktemp)
  generated=$(mktemp)
  watch=$(mktemp)

  if [ -n "${PREV_TAG:-}" ]; then
    gh api "repos/$GITHUB_REPOSITORY/releases/generate-notes" \
      -f tag_name="$TAG" -f target_commitish="$SHA" -f previous_tag_name="$PREV_TAG" \
      --jq .body > "$generated"

    prs=$(grep -oE "/$GITHUB_REPOSITORY/pull/[0-9]+" "$generated" | grep -oE '[0-9]+$' | sort -un || true)
    for n in $prs; do
      gh api "repos/$GITHUB_REPOSITORY/pulls/$n" --jq '.body // ""' | cmd_watch_out "$n" >> "$watch"
    done
  else
    echo "First release on the train, cut from main at $SHA. Earlier changes are in the merged PRs." > "$generated"
  fi

  {
    cat "$generated"
    echo
    echo "## Watch out"
    echo
    if [ -s "$watch" ]; then cat "$watch"; else echo "None flagged."; fi
    echo
    echo "Commit: $SHA"
    if [ -n "${EXTRA_NOTES:-}" ]; then echo; echo "$EXTRA_NOTES"; fi
    if [ -n "${PREV_TAG:-}" ]; then echo; echo "Previous release: $PREV_TAG (roll back to this)"; fi
  } > "$notes"

  if has_release "$TAG"; then
    gh release edit "$TAG" --repo "$GITHUB_REPOSITORY" --notes-file "$notes"
    summary "Release notes rewritten for \`$TAG\`."
  elif [ "${PRERELEASE:-}" = "true" ]; then
    gh release create "$TAG" --repo "$GITHUB_REPOSITORY" --verify-tag --title "$TAG" --notes-file "$notes" --prerelease
    summary "Release notes written for \`$TAG\` (pre-release until promoted)."
  else
    gh release create "$TAG" --repo "$GITHUB_REPOSITORY" --verify-tag --title "$TAG" --notes-file "$notes"
    summary "Release notes written for \`$TAG\`."
  fi
}

case "${1:-}" in
  status) cmd_status ;;
  cut) cmd_cut ;;
  notes) cmd_notes ;;
  watch-out) cmd_watch_out "${2:?PR number}" ;;
  *) echo "usage: $0 status|cut|notes|watch-out N" >&2; exit 2 ;;
esac
