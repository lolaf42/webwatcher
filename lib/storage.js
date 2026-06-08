// lib/storage.js — Verwaltung von Einträgen, Einstellungen und Zustand in browser.storage.local

const api = (typeof browser !== "undefined") ? browser : chrome;

const DEFAULT_ENTRY = {
  id: "dresden-infotage",
  label: "Dresden Infotage",
  url: "https://www.dresden.de/de/wirtschaft/wirtschaftsservice/informationstage.php",
  selector: "#content",
  intervalMinutes: 360,
  enabled: true
};

const DEFAULT_SETTINGS = {
  webhookUrl: "",
  notificationsEnabled: true
};

export async function getEntries() {
  const data = await api.storage.local.get("entries");
  if (!data.entries) {
    // Beim allerersten Start: Dresden-Eintrag als Standard setzen
    await api.storage.local.set({ entries: [DEFAULT_ENTRY] });
    return [DEFAULT_ENTRY];
  }
  return data.entries;
}

export async function saveEntries(entries) {
  await api.storage.local.set({ entries });
}

export async function getSettings() {
  const data = await api.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
}

export async function saveSettings(settings) {
  const current = await getSettings();
  await api.storage.local.set({ settings: { ...current, ...settings } });
}

// Zustand pro Eintrag: { hash, text, lastModified, lastChecked, lastChanged, error, reachable }
export async function getState(id) {
  const data = await api.storage.local.get("state");
  const all = data.state || {};
  return all[id] || {};
}

export async function setState(id, partial) {
  const data = await api.storage.local.get("state");
  const all = data.state || {};
  all[id] = { ...(all[id] || {}), ...partial };
  await api.storage.local.set({ state: all });
  return all[id];
}

export async function getAllState() {
  const data = await api.storage.local.get("state");
  return data.state || {};
}

export { DEFAULT_ENTRY, DEFAULT_SETTINGS };
