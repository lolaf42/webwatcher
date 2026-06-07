import { loadAll, saveEntries, saveSettings, DEFAULT_ENTRY } from "../lib/storage.js";

let entries = [];
let settings = {};

function newEntry() {
  return {
    ...DEFAULT_ENTRY,
    id: crypto.randomUUID(),
    url: "",
    label: "",
  };
}

function renderEntries() {
  const container = document.getElementById("entries-container");
  container.innerHTML = "";

  entries.forEach((entry, idx) => {
    const div = document.createElement("div");
    div.className = "entry-row";
    div.dataset.idx = idx;

    div.innerHTML = `
      <div class="entry-row-header">
        <span class="entry-row-title">Entry ${idx + 1}</span>
        <button class="btn-remove" data-idx="${idx}" title="Remove">✕</button>
      </div>
      <div class="entry-grid">
        <div class="full">
          <label>URL *</label>
          <input type="url" class="f-url" placeholder="https://example.com/page" value="${escAttr(entry.url)}" required />
        </div>
        <div class="full">
          <label>Label (shown in notifications &amp; email subject)</label>
          <input type="text" class="f-label" placeholder="e.g. Dresden Infotage" value="${escAttr(entry.label)}" />
        </div>
        <div>
          <label>CSS Selector</label>
          <input type="text" class="f-selector" placeholder="#content" value="${escAttr(entry.selector)}" />
        </div>
        <div>
          <label>Check interval (minutes)</label>
          <input type="number" class="f-interval" min="1" max="10080" value="${entry.intervalMinutes}" />
        </div>
      </div>
      <label class="entry-toggle">
        <input type="checkbox" class="f-enabled" ${entry.enabled ? "checked" : ""} />
        Enabled
      </label>
    `;

    container.appendChild(div);

    // Bind live sync
    div.querySelector(".f-url").addEventListener("input", (e) => { entries[idx].url = e.target.value.trim(); });
    div.querySelector(".f-label").addEventListener("input", (e) => { entries[idx].label = e.target.value.trim(); });
    div.querySelector(".f-selector").addEventListener("input", (e) => { entries[idx].selector = e.target.value.trim(); });
    div.querySelector(".f-interval").addEventListener("input", (e) => {
      const v = parseInt(e.target.value, 10);
      entries[idx].intervalMinutes = isNaN(v) ? 360 : Math.max(1, v);
    });
    div.querySelector(".f-enabled").addEventListener("change", (e) => { entries[idx].enabled = e.target.checked; });
    div.querySelector(".btn-remove").addEventListener("click", () => {
      entries.splice(idx, 1);
      renderEntries();
    });
  });
}

async function init() {
  const data = await loadAll();
  entries = data.entries;
  settings = data.settings;

  document.getElementById("webhook-url").value = settings.webhookUrl ?? "";
  document.getElementById("notifications-enabled").checked = settings.notificationsEnabled ?? true;

  renderEntries();
}

document.getElementById("btn-add").addEventListener("click", () => {
  entries.push(newEntry());
  renderEntries();
});

document.getElementById("btn-save").addEventListener("click", async () => {
  settings.webhookUrl = document.getElementById("webhook-url").value.trim();
  settings.notificationsEnabled = document.getElementById("notifications-enabled").checked;

  await saveEntries(entries);
  await saveSettings(settings);

  // Tell background to reschedule alarms
  await browser.runtime.sendMessage({ type: "RESCHEDULE" });

  const status = document.getElementById("save-status");
  status.textContent = "Saved!";
  setTimeout(() => { status.textContent = ""; }, 2500);
});

function escAttr(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

init();
