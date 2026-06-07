// WebWatcher background service worker

import { loadAll } from "./lib/storage.js";
import { checkEntry } from "./lib/checker.js";

const ALARM_PREFIX = "webwatcher-";

// ── Alarm registration ───────────────────────────────────────────────────────

async function scheduleAlarms() {
  const { entries } = await loadAll();

  // Clear existing WebWatcher alarms
  const existing = await browser.alarms.getAll();
  for (const alarm of existing) {
    if (alarm.name.startsWith(ALARM_PREFIX)) {
      await browser.alarms.clear(alarm.name);
    }
  }

  for (const entry of entries) {
    if (!entry.enabled) continue;
    browser.alarms.create(`${ALARM_PREFIX}${entry.id}`, {
      delayInMinutes: entry.intervalMinutes,
      periodInMinutes: entry.intervalMinutes,
    });
  }
}

// ── Alarm handler ────────────────────────────────────────────────────────────

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;
  const entryId = alarm.name.slice(ALARM_PREFIX.length);

  const { entries, settings } = await loadAll();
  const entry = entries.find((e) => e.id === entryId);
  if (!entry || !entry.enabled) return;

  await checkEntry(entry, settings.webhookUrl, settings.notificationsEnabled);
});

// ── Message handler (from popup / options) ───────────────────────────────────

browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "CHECK_NOW") {
    const { entries, settings } = await loadAll();
    const entry = entries.find((e) => e.id === msg.entryId);
    if (!entry) return { error: "Entry not found" };
    const result = await checkEntry(entry, settings.webhookUrl, settings.notificationsEnabled);
    return result;
  }

  if (msg.type === "RESCHEDULE") {
    await scheduleAlarms();
    return { ok: true };
  }
});

// ── Init on install / startup ────────────────────────────────────────────────

browser.runtime.onInstalled.addListener(async () => {
  await scheduleAlarms();
});

browser.runtime.onStartup.addListener(async () => {
  await scheduleAlarms();
});
