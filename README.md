# WebWatcher

A Firefox WebExtension (Manifest V3) that monitors a list of web pages for changes and sends notifications via an [n8n](https://n8n.io/) webhook — which can forward them to your e-mail via SMTP.

Works on **Firefox Desktop** and **Firefox for Android**.

---

## Features

- Monitor any number of URLs, each with its own CSS selector, check interval, and label.
- Change detection: SHA-256 hash of extracted text + optional `letzte Änderung` timestamp.
- Simple line-based diff included in the webhook payload.
- Immediate browser notification on change.
- Per-URL reachability status (HTTP errors / network failures).
- Pre-seeded with the Dresden Informationstage page as a demo entry (remove or edit it freely).

> **Limitation:** Monitoring only runs while Firefox is open. The extension uses `browser.alarms`; there is no server-side component.

---

## File structure

```
webwatcher/
├── manifest.json
├── background.js
├── lib/
│   ├── storage.js      # storage helpers
│   ├── detect.js       # hash, diff, text extraction
│   └── checker.js      # per-entry check logic + webhook POST
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
├── icons/
│   ├── icon48.png
│   └── icon96.png
└── n8n-workflow.json   # importable n8n workflow
```

---

## Installation – Firefox Desktop

1. Open Firefox and navigate to `about:debugging`.
2. Click **This Firefox** in the left sidebar.
3. Click **Load Temporary Add-on…**.
4. Select the `manifest.json` file inside this folder.
5. The WebWatcher icon appears in the toolbar.

> Temporary add-ons are removed when Firefox restarts. For permanent installation sign and distribute via [addons.mozilla.org](https://addons.mozilla.org) or use a self-hosted signed XPI.

---

## Installation – Firefox for Android

**Requirements:** Firefox for Android 120+ (Nightly or Release with custom extension support).

### Enable custom extension collection

1. In Firefox for Android, go to **Settings → About Firefox**.
2. Tap the Firefox logo 5 times to enable Developer Options.
3. Go back to **Settings → Custom Add-on collection**.
4. Enter your [AMO](https://addons.mozilla.org) user ID and a collection containing the WebWatcher XPI, **or** use the ADB / web-ext debug workflow below.

### Debug install via web-ext (recommended for development)

```bash
# Install web-ext if you haven't
npm install -g web-ext

# Enable Remote Debugging on the phone:
# Firefox for Android → Settings → About Firefox (tap 5×) → Remote debugging via USB

# From this directory:
web-ext run --target=firefox-android --adb-device=<device-id>
```

---

## Configuration

1. Click the WebWatcher toolbar icon to open the popup.
2. Click ⚙ (or use the popup menu) to open **Settings**.
3. Paste your **n8n webhook URL** in the Global section.
4. Add/remove monitored URLs. Each entry has:
   - **URL** – the page to watch.
   - **Label** – appears in browser notifications and the e-mail subject.
   - **CSS Selector** – narrow the region to watch (default: `#content`, fallback: `<body>`).
   - **Interval** – how often to check, in minutes (default: 360).
   - **Enabled** toggle.
5. Click **Save**.

---

## n8n webhook setup

1. In n8n go to **Workflows → Import from file** and select `n8n-workflow.json`.
2. Open the **Send Email** node and:
   - Select or create an **SMTP credential**.
   - Set `fromEmail` and `toEmail`.
3. **Activate** the workflow.
4. Copy the **Production Webhook URL** (shown at the top of the Webhook node).
5. Paste it into WebWatcher's Settings page.

### Webhook payload sent by the extension

```json
{
  "url":         "https://example.com/page",
  "label":       "My Page Label",
  "pageTitle":   "Page Title",
  "timestamp":   "2025-06-07T14:00:00.000Z",
  "changedText": "Full extracted text of the monitored region",
  "diff":        "Added:\n...\n\nRemoved:\n..."
}
```

The sample workflow uses `{{ $json.label || $json.url }}` in the e-mail subject, so each monitored page is clearly identified without hardcoding anything.

---

## Granting host permissions for additional domains

The extension ships with host permission for `https://www.dresden.de/*`.

To monitor pages on other domains:

1. Open `manifest.json`.
2. Add the domain to `host_permissions`, e.g.:
   ```json
   "host_permissions": [
     "https://www.dresden.de/*",
     "https://www.example.com/*"
   ]
   ```
3. Reload the extension (`about:debugging` → Reload).

Alternatively, use `"<all_urls>"` for unrestricted access (requires user acknowledgement on install).

---

## Development

No build step required. Edit files and reload the temporary add-on in `about:debugging`.

```bash
# Lint with web-ext
npx web-ext lint

# Run in desktop Firefox
npx web-ext run
```
