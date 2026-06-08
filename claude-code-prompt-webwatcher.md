Build a cross-platform Firefox WebExtension (Manifest V3) that monitors a
user-defined list of web pages for changes and reports detected changes by
e-mail via an n8n webhook. Target: Firefox Desktop AND Firefox for Android.

PRIMARY USE CASE (default seeded entry)
- URL: https://www.dresden.de/de/wirtschaft/wirtschaftsservice/informationstage.php
- CSS selector to monitor: #content
- This page currently shows a placeholder: "An dieser Stelle finden Sie zu
  gegebener Zeit die Ankündigung des nächsten Informationstages." When an
  event is announced, this text changes. Detect that change.
- The page also contains a "letzte Änderung: <date> Uhr" timestamp near the
  footer. Extract this timestamp if present and treat a change in it as a
  strong change signal, in addition to the content hash.

CORE FUNCTION
- User maintains a list of monitored URLs in the options page.
- For each URL the extension periodically fetches the page via
  browser.alarms (interval per URL, default 360 min).
- Fetching only runs while Firefox is open. State this limitation in the UI.

CHANGE DETECTION
- Fetch page HTML with fetch().
- Per URL the user can set a CSS selector to narrow the monitored region.
  Default to #content if none given; only fall back to <body> if the
  selector matches nothing.
- Extract text content of the region, strip whitespace/script/style noise,
  compute a stable SHA-256 hash.
- Separately, if a "letzte Änderung" timestamp is found via regex, store it.
- A change = hash differs OR stored timestamp differs.
- Store last hash, last timestamp, last extracted text per URL in
  browser.storage.local. Do NOT overwrite stored state when the fetch fails.

MULTIPLE PAGES / LABELS
- The list supports an arbitrary number of monitored URLs (different events
  / different sites), each with its own selector, interval and an optional
  user-defined "label" field (e.g. "Dresden Infotage", "Messe XY").
- dresden.de is only the pre-seeded default entry, never hardcoded elsewhere.

NOTIFICATION VIA n8n
- WebExtensions cannot send SMTP. On change, POST JSON to a user-configured
  n8n webhook URL:
  { url, label, pageTitle, timestamp, changedText, diff }
  where changedText is the extracted text of the monitored region and diff
  is the added/removed lines vs. the previous stored text.
- A single n8n webhook receives changes from ALL monitored URLs mixed
  together. The sample n8n workflow must use {{ $json.label }} (or url as
  fallback) in the e-mail subject and body so each notification clearly
  identifies which page changed. Do not hardcode dresden.de in the workflow.
- Also fire a browser.notifications notification as immediate local feedback.

REACHABILITY FEEDBACK
- Record HTTP status / network result per URL on every check.
- Popup shows per URL: reachability (OK / unreachable / HTTP error code),
  last-checked timestamp, and last-change timestamp.
- On unreachable, surface the error and keep the previous stored hash.

UI
- Popup: list of monitored URLs with status + "check now" button per URL.
- Options: add/remove URLs, per-URL label, per-URL interval, per-URL CSS
  selector, global n8n webhook URL, toggle notifications.
- Must be usable on the narrow Firefox-for-Android viewport.

CONSTRAINTS
- Manifest V3, plain ES modules, loadable as a temporary add-on with no
  build step. Permissions: alarms, storage, notifications, host_permissions
  (let user grant per-domain; request dresden.de by default).
- All data local; the only external call is to the user's own n8n webhook.

DELIVERABLES
- manifest.json, background service worker, popup (html/js), options page,
  README with install steps for Desktop and Android, and a sample n8n
  workflow JSON: Webhook node -> (optional Set/format node) -> Send Email
  (SMTP) node that mails the changedText and diff, using the label in the
  subject.
