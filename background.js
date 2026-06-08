// background.js — verwaltet Zeitpläne (alarms) und löst Prüfungen aus

import { getEntries } from "./lib/storage.js";
import { checkEntry } from "./lib/checker.js";

const api = (typeof browser !== "undefined") ? browser : chrome;

async function rescheduleAll() {
  await api.alarms.clearAll();
  const entries = await getEntries();
  for (const entry of entries) {
    if (entry.enabled) {
      api.alarms.create("check:" + entry.id, {
        periodInMinutes: Math.max(1, entry.intervalMinutes || 360),
        delayInMinutes: 1
      });
    }
  }
}

api.runtime.onInstalled.addListener(rescheduleAll);
api.runtime.onStartup.addListener(rescheduleAll);

// Wenn sich Einträge/Einstellungen ändern, Zeitpläne neu aufbauen
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.entries) {
    rescheduleAll();
  }
});

api.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith("check:")) return;
  const id = alarm.name.slice("check:".length);
  const entries = await getEntries();
  const entry = entries.find(e => e.id === id);
  if (entry && entry.enabled) {
    await checkEntry(entry);
  }
});

// Manuelle Prüfung aus Popup/Options
api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "checkNow") {
    (async () => {
      const entries = await getEntries();
      if (msg.id) {
        const entry = entries.find(e => e.id === msg.id);
        if (entry) {
          const result = await checkEntry(entry);
          sendResponse(result);
        } else {
          sendResponse({ error: "Eintrag nicht gefunden" });
        }
      } else {
        // alle prüfen
        for (const entry of entries) {
          if (entry.enabled) await checkEntry(entry);
        }
        sendResponse({ done: true });
      }
    })();
    return true; // asynchrone Antwort
  }
});
