// Storage schema helpers for WebWatcher

export const DEFAULT_ENTRY = {
  id: null,           // crypto.randomUUID()
  url: "https://www.dresden.de/de/wirtschaft/wirtschaftsservice/informationstage.php",
  label: "Dresden Infotage",
  selector: "#content",
  intervalMinutes: 360,
  enabled: true,
};

export const DEFAULT_SETTINGS = {
  webhookUrl: "",
  notificationsEnabled: true,
};

// Returns { entries: [], settings: {} }
export async function loadAll() {
  const data = await browser.storage.local.get(["entries", "settings"]);
  return {
    entries: data.entries ?? [{ ...DEFAULT_ENTRY, id: "default-dresden" }],
    settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
  };
}

export async function saveEntries(entries) {
  await browser.storage.local.set({ entries });
}

export async function saveSettings(settings) {
  await browser.storage.local.set({ settings });
}

// Per-URL state key
export function stateKey(id) {
  return `state_${id}`;
}

export async function loadState(id) {
  const key = stateKey(id);
  const data = await browser.storage.local.get(key);
  return data[key] ?? null;
}

export async function saveState(id, state) {
  await browser.storage.local.set({ [stateKey(id)]: state });
}
