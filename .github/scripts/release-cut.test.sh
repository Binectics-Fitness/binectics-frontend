#!/usr/bin/env bash
# Tests for release-cut.sh. Same file in all three Binectics repos.
#
#   bash .github/scripts/release-cut.test.sh
#
# Needs only bash, git and python3. A local bare repo stands in for GitHub
# (git's url.insteadOf maps the GitHub URL onto it), and a stub `gh` keeps
# Releases as files. Nothing touches the network.
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/release-cut.sh"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILS=0

pass() { echo "ok   $1"; }
fail() { echo "FAIL $1"; FAILS=$((FAILS + 1)); }
expect_eq() { if [ "$2" = "$3" ]; then pass "$1"; else fail "$1"; echo "  want: $3"; echo "  got:  $2"; fi; }

# ---------------------------------------------------------------- watch out
wo() { printf '%b' "$2" | GITHUB_REPOSITORY=o/r GH_TOKEN=x bash "$SCRIPT" watch-out "$1"; }

expect_eq "heading section, bullets" \
  "$(wo 1 '## Summary\nx\n\n## Watch out\n- Runs a boot migration\n- Web needs this first\n\n## Test plan\n- jest\n')" \
  "$(printf -- '- Runs a boot migration (#1)\n- Web needs this first (#1)')"

expect_eq "bold heading, CRLF, None skipped" \
  "$(wo 2 'Body\r\n\r\n**Watch out**\r\n\r\nNone\r\n')" ""

expect_eq "multi-line HTML comment dropped" \
  "$(wo 3 '### Watch out:\n<!-- anything\n## risky\nhere -->\n1. Changes the cookie name\n### Checks\nok\n')" \
  "- Changes the cookie name (#3)"

expect_eq "a # line inside a code fence does not end the section" \
  "$(wo 4 '## Watch out\n- Run this after deploy:\n```\n# reindex\nnpm run reindex\n```\n- Second item\n## Next\n- no\n')" \
  "$(printf -- '- Run this after deploy: # reindex npm run reindex (#4)\n- Second item (#4)')"

expect_eq "wrapped lines are joined" \
  "$(wo 5 '## Watch out\n- Backfills membership.freeze_until\n  for every active member (additive)\n- Short one\n')" \
  "$(printf -- '- Backfills membership.freeze_until for every active member (additive) (#5)\n- Short one (#5)')"

expect_eq "@mentions neutralised, emails and code left alone" \
  "$(wo 6 '## Watch out\n- Ping @daniel and @Binectics-Fitness/devs, not a@b.com or `@kept`\n')" \
  '- Ping `@daniel` and `@Binectics-Fitness/devs`, not a@b.com or `@kept` (#6)'

expect_eq "a Watch out heading inside a fence is not a heading" \
  "$(wo 7 '```\n## Watch out\n- fake\n```\n')" ""

expect_eq "unclosed comment dropped to the end" \
  "$(wo 8 '## Watch out\n- Real\n<!-- template hint\n- not real\n')" \
  "- Real (#8)"

expect_eq "no Watch out heading at all" "$(wo 9 '## Summary\n- watch out for this\n')" ""

# --------------------------------------------------------------------- cut
export GITHUB_REPOSITORY=o/r GH_TOKEN=tok GITHUB_OUTPUT="$T/out" GITHUB_STEP_SUMMARY="$T/sum"
export GIT_CONFIG_GLOBAL="$T/gitconfig" GIT_CONFIG_NOSYSTEM=1
unset GITHUB_ACTIONS CUT_SHA FALLBACK_TOKEN
git config --global user.email t@example.com
git config --global user.name t
git config --global init.defaultBranch main
git config --global url."$T/origin.git".insteadOf "https://github.com/o/r.git"

mkdir -p "$T/bin" "$T/releases"
cat > "$T/bin/gh" <<EOF
#!/usr/bin/env bash
R="$T/releases"
case "\$1 \$2" in
  "release view")
    [ -f "\$R/\$3" ] || exit 1
    case "\$*" in
      *--json*) if grep -q 'flags=prerelease' "\$R/\$3"; then echo true; else echo false; fi ;;
    esac ;;
  "release create"|"release edit")
    tag=\$3; verb=\$2; flags=""; nf=""
    shift 3
    while [ \$# -gt 0 ]; do
      case "\$1" in --notes-file) nf=\$2; shift ;; --prerelease) flags=prerelease ;; esac
      shift
    done
    { echo "verb=\$verb flags=\$flags"; [ -n "\$nf" ] && cat "\$nf"; } > "\$R/\$tag" ;;
  "api repos/o/r/releases/generate-notes")
    printf '## What changed\\n* feat: a by @d in https://github.com/o/r/pull/12\\n* fix: b in https://github.com/o/r/pull/13\\n' ;;
  "api repos/o/r/pulls/12") printf '## Watch out\\n- Runs a boot migration\\n' ;;
  "api repos/o/r/pulls/13") printf 'No section here\\n' ;;
  *) exit 0 ;;
esac
EOF
chmod +x "$T/bin/gh"
export PATH="$T/bin:$PATH"

git init -q --bare "$T/origin.git"
git clone -q "$T/origin.git" "$T/dev" 2>/dev/null
commit() { (cd "$T/dev" && echo "$1" > "$1" && git add "$1" && git commit -qm "$1" && git push -q origin HEAD:main); }
commit a
git clone -q "$T/origin.git" "$T/runner" 2>/dev/null

run() { : > "$T/out"; (cd "$T/runner" && bash "$SCRIPT" "$@") >"$T/log" 2>&1; echo $?; }
o() { grep "^$1=" "$T/out" | tail -1 | cut -d= -f2-; }
DAY=$(date -u +%Y-%m-%d)

expect_eq "status before anything: pending" "$(run status; o pending)" "$(printf '0\ntrue')"
expect_eq "first run creates release and tags it" "$(run cut; o cut; o tag; o prev_tag)" "$(printf '0\ntrue\nrelease-%s\n' "$DAY")"
expect_eq "release branch exists at main" "$(git -C "$T/origin.git" rev-parse release)" "$(git -C "$T/origin.git" rev-parse main)"
expect_eq "rerun with no Release asks for notes only" "$(run cut; o cut; o notes; o tag)" "$(printf '0\nfalse\ntrue\nrelease-%s' "$DAY")"
touch "$T/releases/release-$DAY"
expect_eq "rerun with the Release present does nothing" "$(run cut; o cut; o notes)" "$(printf '0\nfalse\nfalse')"
expect_eq "status when nothing to cut" "$(run status; o pending)" "$(printf '0\nfalse')"

commit b
expect_eq "second cut the same day gets -2" "$(run cut; o cut; o tag; o prev_tag)" "$(printf '0\ntrue\nrelease-%s-2\nrelease-%s' "$DAY" "$DAY")"
commit c
OLD_C=$(git -C "$T/origin.git" rev-parse main)
commit d
expect_eq "CUT_SHA cuts at the approved commit, not main's head" \
  "$(CUT_SHA=$OLD_C run cut; o sha; o tag)" "$(printf '0\n%s\nrelease-%s-3' "$OLD_C" "$DAY")"
expect_eq "CUT_SHA behind release is nothing to cut" "$(CUT_SHA=$OLD_C run cut; o cut)" "$(printf '0\nfalse')"
expect_eq "CUT_SHA not on main is refused" "$(CUT_SHA=0123456789012345678901234567890123456789 run cut)" "1"

# A branch whose name ends in /release must not be mistaken for release.
(cd "$T/dev" && git push -q origin HEAD:refs/heads/chore/release)
expect_eq "chore/release is not release" "$(run status; o release_sha)" "$(printf '0\n%s' "$OLD_C")"

# Untagged release head (e.g. created by hand): tagged, notes requested.
(cd "$T/dev" && git push -q origin HEAD:release)
expect_eq "untagged release head gets a tag" "$(run cut; o cut; o notes; o tag)" "$(printf '0\nfalse\ntrue\nrelease-%s-4' "$DAY")"

(cd "$T/dev" && git checkout -q -b side origin/release 2>/dev/null; git fetch -q; git reset -q --hard origin/release; echo x > x; git add x; git commit -qm x; git push -q origin HEAD:release; git checkout -q main)
commit e
BEFORE=$(git -C "$T/origin.git" rev-parse release)
expect_eq "diverged release is refused" "$(run cut)" "1"
expect_eq "diverged release is left alone" "$(git -C "$T/origin.git" rev-parse release)" "$BEFORE"
grep -q 'release has diverged' "$T/log" && pass "diverged error explains itself" || fail "diverged error explains itself"

# ------------------------------------------------------------------- notes
notes() { (cd "$T/runner" && TAG=$1 PREV_TAG=$2 SHA=abc PRERELEASE=${3:-} EXTRA_NOTES="Extra" bash "$SCRIPT" notes) >"$T/log" 2>&1; echo $?; }
rm -f "$T/releases/release-n1"
expect_eq "notes create a pre-release when asked" "$(notes release-n1 release-n0 true; head -1 "$T/releases/release-n1")" "$(printf '0\nverb=create flags=prerelease')"
grep -qx -- '- Runs a boot migration (#12)' "$T/releases/release-n1" && pass "notes carry the Watch out line" || fail "notes carry the Watch out line"
grep -qx 'Previous release: release-n0 (roll back to this)' "$T/releases/release-n1" && pass "notes name the previous release" || fail "notes name the previous release"
expect_eq "rerun edits instead of creating" "$(notes release-n1 release-n0 true; head -1 "$T/releases/release-n1")" "$(printf '0\nverb=edit flags=')"
expect_eq "first release has no Watch out lines" "$(notes release-n2 ''; grep -c 'None flagged.' "$T/releases/release-n2")" "$(printf '0\n1')"

# On a runner the token mask goes to stderr, so it cannot corrupt a sha.
expect_eq "status on a runner still reads clean shas" \
  "$(GITHUB_ACTIONS=true run status; o release_sha)" "$(printf '0\n%s' "$(git -C "$T/origin.git" rev-parse release)")"

# ----------------------------------------------------------- should-deploy
sd() { : > "$T/out"; (CUT=$1 SHA=head TAG=$2 LIVE_SHA=$3 bash "$SCRIPT" should-deploy) >"$T/log" 2>&1; o deploy; }
echo "verb=create flags=prerelease" > "$T/releases/rel-pre"
echo "verb=edit flags=" > "$T/releases/rel-promoted"
expect_eq "a new cut deploys" "$(sd true rel-promoted old)" "true"
expect_eq "already serving the head: no deploy" "$(sd false rel-promoted head)" "false"
expect_eq "head never passed its deploy (pre-release): retry" "$(sd false rel-pre old)" "true"
expect_eq "head has no Release: retry" "$(sd false rel-missing old)" "true"
expect_eq "no tag at the head: retry" "$(sd false '' old)" "true"
expect_eq "promoted head, older build live: a rollback, left alone" "$(sd false rel-promoted old)" "false"
grep -q 'deliberate rollback' "$T/log" && pass "rollback warning explains itself" || fail "rollback warning explains itself"
expect_eq "API not answering: no deploy" "$(sd false rel-pre '')" "false"

echo
if [ "$FAILS" -gt 0 ]; then echo "$FAILS failed"; exit 1; fi
echo "all passed"
