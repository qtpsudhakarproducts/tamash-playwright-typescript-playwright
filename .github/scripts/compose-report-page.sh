#!/usr/bin/env bash
# Builds this run's report into _site/history/<run>/ (a self-contained snapshot) and regenerates
# the root _site/index.html as a "latest" mirror plus a list of every past run under history/.
# _site is expected to already be a checkout of the report-history branch; run-data/ holds this
# run's freshly-downloaded artifacts (initial-run/, healing-report/, post-healing-run/).
#
# Pulled out of the workflow YAML (rather than inlined under `run: |`) because a heredoc's closing
# delimiter must sit at column 0, which conflicts with YAML's indented block-scalar body — see the
# git history of playwright.yml for the bug this caused the first time it was tried inline.
set -euo pipefail

SITE_DIR="_site"
DATA_DIR="run-data"
JQ="${JQ_BIN:-jq}"

RUN_NUMBER_PADDED="$(printf '%05d' "$GITHUB_RUN_NUMBER")"
SHORT_SHA="${GITHUB_SHA:0:7}"
RUN_ID="${RUN_NUMBER_PADDED}-${SHORT_SHA}"
RUN_DIR="$SITE_DIR/history/$RUN_ID"
# Rebuilt from scratch each time rather than merged into — a re-run of the same CI run (same
# run number + sha, e.g. via `gh run rerun`) must overwrite its own entry cleanly, not nest a
# fresh copy inside the one already there (cp -r into an existing dir copies *into* it).
rm -rf "$RUN_DIR"
mkdir -p "$RUN_DIR"

[ -d "$DATA_DIR/initial-run" ] && cp -r "$DATA_DIR/initial-run" "$RUN_DIR/initial-run"

POST_HEALING_AVAILABLE=false
if [ -d "$DATA_DIR/post-healing-run" ] && [ "$(ls -A "$DATA_DIR/post-healing-run" 2>/dev/null)" ]; then
  cp -r "$DATA_DIR/post-healing-run" "$RUN_DIR/post-healing-run"
  POST_HEALING_AVAILABLE=true
fi

HEALED_COUNT=0
SKIPPED_COUNT=0
FIXES_HTML=""
REPORT_JSON="$DATA_DIR/healing-report/apply-heals-report.json"
if [ -f "$REPORT_JSON" ]; then
  HEALED_COUNT=$("$JQ" '[.fixes[] | select(.applied)] | length' "$REPORT_JSON")
  SKIPPED_COUNT=$("$JQ" '[.fixes[] | select(.applied | not)] | length' "$REPORT_JSON")
  FIXES_HTML=$("$JQ" -r '.fixes[] | select(.applied) |
    "<article class=\"fix\"><h3>" + (.file | @html) + ":" + (.line | tostring) + "</h3>" +
    "<p class=\"before\"><span>before</span><code>" + (.before | @html) + "</code></p>" +
    "<p class=\"after\"><span>after</span><code>" + (.after | @html) + "</code></p></article>"
  ' "$REPORT_JSON")
fi

HEALING_SECTION="<p class=\"muted\">No selectors needed healing on this run.</p>"
if [ "$HEALED_COUNT" -gt 0 ]; then
  HEALING_SECTION="<p>$HEALED_COUNT fix(es) applied, $SKIPPED_COUNT skipped.</p><div class=\"fixes\">$FIXES_HTML</div>"
fi

META="Run <a href=\"$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID\">#$GITHUB_RUN_NUMBER</a> &middot; commit <code>$GITHUB_SHA</code> &middot; $(date -u +"%Y-%m-%d %H:%M UTC")"

STYLE='
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; max-width: 860px; margin: 2.5rem auto; padding: 0 1.25rem; line-height: 1.55; }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.15rem; margin-top: 2.5rem; border-bottom: 1px solid #8883; padding-bottom: 0.4rem; }
  .meta { color: #888; font-size: 0.85rem; }
  .button { display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 0.55rem 1rem; border-radius: 6px; font-size: 0.9rem; }
  .button:hover { background: #1d4ed8; }
  .muted { color: #888; }
  .fixes { display: grid; gap: 0.9rem; margin-top: 1rem; }
  .fix { border: 1px solid #8883; border-radius: 8px; padding: 0.9rem 1.1rem; }
  .fix h3 { margin: 0 0 0.6rem; font-size: 0.9rem; font-family: ui-monospace, monospace; font-weight: 600; }
  .fix p { margin: 0.3rem 0; font-size: 0.85rem; }
  .fix span { display: inline-block; width: 4.5em; color: #888; font-size: 0.75rem; text-transform: uppercase; }
  .fix code { font-family: ui-monospace, monospace; }
  .before code { color: #b91c1c; }
  .after code { color: #15803d; }
  .history-list { padding-left: 1.2rem; }
  .history-list li { margin: 0.25rem 0; font-size: 0.85rem; }
  .history-list a { font-family: ui-monospace, monospace; }
  .history-list .current { color: #888; }
'

# base: link prefix to this run's assets ("" from inside history/<run>/, "history/<run>/" from root).
# history_html: extra section appended near the end — the "past runs" list, root page only.
render_page() {
  local base="$1"
  local history_html="$2"
  local post_section="<p class=\"muted\">No healing was needed this run, so there's no post-healing verification to show.</p>"
  if [ "$POST_HEALING_AVAILABLE" = true ]; then
    post_section="<a class=\"button\" href=\"${base}post-healing-run/index.html\">Open the post-healing test report &rarr;</a><p class=\"muted\">Same suite, re-run with <code>HEALER_ENABLED=false</code> &mdash; proves the applied fixes work standalone, not just with the AI safety net still on.</p>"
  fi
  cat <<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>tamash-playwright self-healing report</title>
<style>$STYLE</style>
</head>
<body>
<h1>tamash-playwright self-healing report</h1>
<p class="meta">$META</p>

<h2>1. Initial execution (healing enabled)</h2>
<a class="button" href="${base}initial-run/index.html">Open the initial test report &rarr;</a>
<p class="muted">The real run &mdash; broken locators healed live by the AI as the suite executed.</p>

<h2>2. Healing report</h2>
$HEALING_SECTION

<h2>3. Post-healing execution (healing disabled)</h2>
$post_section
$history_html
</body>
</html>
HTML
}

render_page "" "" > "$RUN_DIR/index.html"

HISTORY_ITEMS=""
for d in $(ls -1 "$SITE_DIR/history" | sort -r); do
  if [ "$d" = "$RUN_ID" ]; then
    HISTORY_ITEMS="${HISTORY_ITEMS}<li><span class=\"current\">$d (this run)</span></li>"
  else
    HISTORY_ITEMS="${HISTORY_ITEMS}<li><a href=\"history/$d/index.html\">$d</a></li>"
  fi
done
HISTORY_HTML="<h2>Past runs</h2><ul class=\"history-list\">$HISTORY_ITEMS</ul>"

render_page "history/$RUN_ID/" "$HISTORY_HTML" > "$SITE_DIR/index.html"
