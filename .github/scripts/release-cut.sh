#!/usr/bin/env bash
# Release train: the cut.
#
# The same file lives in binectics-api, binectics-frontend and
# binectics-mobile. Change all three together.
#
#   release-cut.sh cut    fast-forward `release` to `main` and tag it
#   release-cut.sh notes  write the GitHub Release for the tag just cut
#
# Runs on a GitHub runner with nothing but git, curl, gh and python3: no
# npm install. Inputs come from the environment:
#
#   GITHUB_REPOSITORY  owner/name (set by Actions)
#   GH_TOKEN           the job's GITHUB_TOKEN (contents: write)
#   FALLBACK_TOKEN     optional, secrets.RELEASE_TRAIN_TOKEN (see below)
#   TAG, PREV_TAG, SHA notes only: the outputs of the cut step
#   EXTRA_NOTES        notes only, optional: a line added to the Release
#
# Why a fallback token: GitHub refuses to let GITHUB_TOKEN move a ref when
# the move brings in a change to a file under .github/workflows/ ("refusing
# to allow a GitHub App to create or update workflow"). GITHUB_TOKEN cannot
# be given that permission. On a day when a merged PR touched a workflow,
# the cut retries the push with RELEASE_TRAIN_TOKEN if the secret exists,
# and fails loudly if it does not.
set -euo pipefail

: "${GITHUB_REPOSITORY:?}" "${GH_TOKEN:?}"

out() { echo "$1=$2" >> "${GITHUB_OUTPUT:-/dev/stdout}"; }
summary() { echo "$*" >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"; }
remote() { echo "https://x-access-token:$1@github.com/${GITHUB_REPOSITORY}.git"; }

# Push with GITHUB_TOKEN; fall back to RELEASE_TRAIN_TOKEN only when GitHub
# refused because of a workflow-file change.
push_refs() {
  local err
  err=$(mktemp)
  if git push --atomic --quiet "$(remote "$GH_TOKEN")" "$@" 2>"$err"; then
    return 0
  fi
  cat "$err" >&2
  if grep -q 'refusing to allow' "$err"; then
    if [ -n "${FALLBACK_TOKEN:-}" ]; then
      echo "GITHUB_TOKEN may not move refs across a workflow-file change. Retrying with RELEASE_TRAIN_TOKEN."
      git push --atomic --quiet "$(remote "$FALLBACK_TOKEN")" "$@"
      return
    fi
    echo "::error title=Release train blocked::A PR merged since the last release changed a file under .github/workflows/, and GITHUB_TOKEN is not allowed to move a branch across that. Add a RELEASE_TRAIN_TOKEN repository secret (a fine-grained token with Contents and Workflows read/write on this repo), then run the Release train workflow again."
  fi
  return 1
}

cmd_cut() {
  local origin main_sha release_sha prev_tag day tag n
  origin=$(remote "$GH_TOKEN")

  git fetch --quiet --force --tags "$origin" '+refs/heads/main:refs/remotes/origin/main'
  main_sha=$(git rev-parse refs/remotes/origin/main)
  release_sha=$(git ls-remote --heads "$origin" release | cut -f1)

  out sha "$main_sha"

  if [ "$release_sha" = "$main_sha" ]; then
    echo "main and release are both at $main_sha. Nothing to release."
    summary "Nothing to release: \`main\` and \`release\` are both at \`$main_sha\`."
    out cut false
    return 0
  fi

  prev_tag=""
  if [ -n "$release_sha" ]; then
    git fetch --quiet "$origin" '+refs/heads/release:refs/remotes/origin/release'
    if ! git merge-base --is-ancestor "$release_sha" "$main_sha"; then
      echo "::error title=release has diverged from main::release ($release_sha) is not an ancestor of main ($main_sha), so it cannot be fast-forwarded. Someone committed to release directly. Get those commits onto main through a PR (then the next run fast-forwards), or, if they are unwanted, ask the owner to reset release to the last release tag. The train never force-pushes."
      exit 1
    fi
    prev_tag=$(git describe --tags --abbrev=0 --match 'release-*' "$release_sha" 2>/dev/null || true)
  else
    echo "No release branch yet. This first run creates it from main."
  fi

  day=$(date -u +%Y-%m-%d)
  tag="release-$day"
  n=1
  while git rev-parse --quiet --verify "refs/tags/$tag" >/dev/null; do
    n=$((n + 1))
    tag="release-$day-$n"
  done

  git tag "$tag" "$main_sha"
  # Atomic: the branch and the tag move together or not at all. No force, so
  # GitHub itself also rejects anything but a fast-forward.
  push_refs "$main_sha:refs/heads/release" "refs/tags/$tag"

  echo "release fast-forwarded ${release_sha:-<new>} -> $main_sha and tagged $tag."
  summary "Cut \`$tag\` at \`$main_sha\` (previous release: ${prev_tag:-none})."
  out cut true
  out tag "$tag"
  out prev_tag "$prev_tag"
}

# Lines under a "Watch out" heading in a PR body, up to the next heading.
extract_watch_out() {
  python3 -c '
import re, sys
num = sys.argv[1]
head = re.compile(r"^\s*(#{1,6}\s*)?(\*\*)?\s*watch out\s*:?\s*(\*\*)?\s*:?\s*$", re.I)
other = re.compile(r"^\s*(#{1,6}\s+\S|\*\*[^*]+\*\*\s*:?\s*$)")
empty = {"none", "n/a", "na", "nothing", "-", "none.", "nothing."}
on = False
for raw in sys.stdin.read().replace("\r", "").split("\n"):
    if head.match(raw):
        on = True
        continue
    if on and other.match(raw):
        on = False
    if not on:
        continue
    text = re.sub(r"^\s*([-*+]|\d+\.)\s+", "", raw).strip()
    if not text or text.startswith("<!--") or text.lower() in empty:
        continue
    print(f"- {text} (#{num})")
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
      gh api "repos/$GITHUB_REPOSITORY/pulls/$n" --jq '.body // ""' | extract_watch_out "$n" >> "$watch"
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

  gh release create "$TAG" --repo "$GITHUB_REPOSITORY" --verify-tag --title "$TAG" --notes-file "$notes"
  summary "Release notes written for \`$TAG\`."
}

case "${1:-}" in
  cut) cmd_cut ;;
  notes) cmd_notes ;;
  *) echo "usage: $0 cut|notes" >&2; exit 2 ;;
esac
