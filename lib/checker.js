// lib/checker.js — prüft einen Eintrag: abrufen, vergleichen, melden

import { sha256, extractText, extractLastModified, computeDiff } from "./detect.js";
import { getState, setState, getSettings } from "./storage.js";

const api = (typeof browser !== "undefined") ? browser : chrome;

export async function checkEntry(entry) {
  const prev = await getState(entry.id);
  const now = new Date().toISOString();

  let html;
  try {
    const res = await fetch(entry.url, { cache: "no-store" });
    if (!res.ok) {
      // Nicht erreichbar: Fehler vermerken, gespeicherten Hash NICHT überschreiben
      await setState(entry.id, {
        lastChecked: now,
        reachable: false,
        error: "HTTP " + res.status
      });
      return { changed: false, reachable: false, error: "HTTP " + res.status };
    }
    html = await res.text();
  } catch (e) {
    await setState(entry.id, {
      lastChecked: now,
      reachable: false,
      error: e.message || "Netzwerkfehler"
    });
    return { changed: false, reachable: false, error: e.message || "Netzwerkfehler" };
  }

  const text = extractText(html, entry.selector);
  const hash = await sha256(text);
  const lastModified = extractLastModified(html);

  const hashChanged = prev.hash && prev.hash !== hash;
  const tsChanged = prev.lastModified && lastModified && prev.lastModified !== lastModified;
  const isFirstRun = !prev.hash;

  // Bei Erstlauf: Zustand setzen, aber NICHT als Änderung melden
  if (isFirstRun) {
    await setState(entry.id, {
      hash, text, lastModified,
      lastChecked: now, reachable: true, error: null
    });
    return { changed: false, reachable: true, firstRun: true };
  }

  const changed = hashChanged || tsChanged;

  if (changed) {
    const diff = computeDiff(prev.text, text);
    await notify(entry, text, diff, lastModified);
    await setState(entry.id, {
      hash, text, lastModified,
      lastChecked: now, lastChanged: now, reachable: true, error: null
    });
    return { changed: true, reachable: true };
  }

  // Keine Änderung
  await setState(entry.id, {
    lastChecked: now, reachable: true, error: null
  });
  return { changed: false, reachable: true };
}

async function notify(entry, text, diff, lastModified) {
  const settings = await getSettings();
  const payload = {
    url: entry.url,
    label: entry.label || entry.url,
    pageTitle: entry.label || entry.url,
    timestamp: lastModified || new Date().toISOString(),
    changedText: text.slice(0, 5000),
    diff: diff
  };

  // Webhook an n8n — sendet Änderungsdaten als JSON-POST an die konfigurierte URL.
  // Der n8n-Workflow (siehe n8n-workflow.json / N8N_INTEGRATION.md) empfängt den
  // Payload, wertet den Inhalt aus und verschickt eine E-Mail-Benachrichtigung.
  // Webhook-URL wird in den Addon-Einstellungen unter "Webhook-URL" eingetragen.
  if (settings.webhookUrl) {
    try {
      await fetch(settings.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Webhook-Fehler:", e);
    }
  }

  // Lokale Browser-Benachrichtigung
  if (settings.notificationsEnabled) {
    try {
      await api.notifications.create({
        type: "basic",
        iconUrl: api.runtime.getURL("icons/icon-96.png"),
        title: "Änderung erkannt: " + (entry.label || entry.url),
        message: (diff || text).slice(0, 200)
      });
    } catch (e) {
      console.error("Notification-Fehler:", e);
    }
  }
}
