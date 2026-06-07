// Core page-checking logic used by background worker

import { sha256, extractText, extractLastModified, extractTitle, computeDiff } from "./detect.js";
import { loadState, saveState } from "./storage.js";

export async function checkEntry(entry, webhookUrl, notificationsEnabled) {
  const { id, url, label, selector } = entry;

  let html, status, errorMsg;

  try {
    const resp = await fetch(url, { cache: "no-store" });
    status = resp.status;
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    html = await resp.text();
  } catch (err) {
    errorMsg = err.message;
    // Update reachability but keep previous hash
    const prev = await loadState(id);
    await saveState(id, {
      ...(prev ?? {}),
      lastChecked: Date.now(),
      reachable: false,
      error: errorMsg,
    });
    return { changed: false, error: errorMsg };
  }

  const text = extractText(html, selector ?? "#content");
  const hash = await sha256(text);
  const lastModified = extractLastModified(html);
  const pageTitle = extractTitle(html);

  const prev = await loadState(id);

  const hashChanged = prev && prev.hash !== hash;
  const tsChanged = prev && lastModified && prev.lastModified !== lastModified;
  const changed = !prev || hashChanged || tsChanged;

  const now = Date.now();

  if (changed && prev) {
    // Something changed — notify
    const diff = computeDiff(prev.text ?? "", text);

    if (webhookUrl) {
      await sendWebhook(webhookUrl, {
        url,
        label: label || url,
        pageTitle,
        timestamp: new Date(now).toISOString(),
        changedText: text,
        diff: `Added:\n${diff.added}\n\nRemoved:\n${diff.removed}`,
      });
    }

    if (notificationsEnabled) {
      browser.notifications.create(`change-${id}-${now}`, {
        type: "basic",
        title: `WebWatcher: ${label || url}`,
        message: `Page changed! ${diff.summary}`,
        iconUrl: browser.runtime.getURL("icons/icon96.png"),
      });
    }

    await saveState(id, {
      hash,
      text,
      lastModified,
      pageTitle,
      lastChecked: now,
      lastChanged: now,
      reachable: true,
      error: null,
    });

    return { changed: true, diff };
  }

  // No change — just update lastChecked
  await saveState(id, {
    ...(prev ?? {}),
    hash,
    text,
    lastModified,
    pageTitle,
    lastChecked: now,
    reachable: true,
    error: null,
    // preserve lastChanged from previous state
    lastChanged: prev?.lastChanged ?? null,
  });

  return { changed: false };
}

async function sendWebhook(webhookUrl, payload) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("WebWatcher: webhook delivery failed", err);
  }
}
