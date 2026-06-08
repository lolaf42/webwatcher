import { getEntries, saveEntries, getSettings, saveSettings } from "../lib/storage.js";

function uid() {
  return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function entryRow(entry) {
  const div = document.createElement("div");
  div.className = "entry";
  div.dataset.id = entry.id;
  div.innerHTML = `
    <label>Name / Label
      <input type="text" class="f-label" value="${escape(entry.label || "")}" placeholder="z. B. Dresden Infotage">
    </label>
    <label>URL
      <input type="url" class="f-url" value="${escape(entry.url || "")}" placeholder="https://...">
    </label>
    <div class="row">
      <label>CSS-Selektor (optional)
        <input type="text" class="f-selector" value="${escape(entry.selector || "")}" placeholder="#content">
      </label>
      <label>Intervall (Minuten)
        <input type="number" class="f-interval" min="1" value="${entry.intervalMinutes || 360}">
      </label>
    </div>
    <label class="checkbox">
      <input type="checkbox" class="f-enabled" ${entry.enabled ? "checked" : ""}>
      aktiv
    </label>
    <button class="remove">Entfernen</button>
  `;
  div.querySelector(".remove").addEventListener("click", () => div.remove());
  return div;
}

function escape(s) {
  return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function collectEntries() {
  const rows = document.querySelectorAll(".entry");
  const entries = [];
  for (const row of rows) {
    const url = row.querySelector(".f-url").value.trim();
    if (!url) continue;
    entries.push({
      id: row.dataset.id,
      label: row.querySelector(".f-label").value.trim(),
      url,
      selector: row.querySelector(".f-selector").value.trim(),
      intervalMinutes: parseInt(row.querySelector(".f-interval").value, 10) || 360,
      enabled: row.querySelector(".f-enabled").checked
    });
  }
  return entries;
}

async function init() {
  const settings = await getSettings();
  document.getElementById("webhook").value = settings.webhookUrl || "";
  document.getElementById("notifications").checked = settings.notificationsEnabled;

  const container = document.getElementById("entries");
  const entries = await getEntries();
  entries.forEach(e => container.appendChild(entryRow(e)));

  document.getElementById("add").addEventListener("click", () => {
    container.appendChild(entryRow({ id: uid(), enabled: true, intervalMinutes: 360, selector: "#content" }));
  });

  document.getElementById("save").addEventListener("click", async () => {
    await saveSettings({
      webhookUrl: document.getElementById("webhook").value.trim(),
      notificationsEnabled: document.getElementById("notifications").checked
    });
    await saveEntries(collectEntries());
    const status = document.getElementById("status");
    status.textContent = "Gespeichert ✓";
    setTimeout(() => (status.textContent = ""), 2000);
  });
}

init();
