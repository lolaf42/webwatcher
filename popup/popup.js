import { getEntries, getAllState } from "../lib/storage.js";

const api = (typeof browser !== "undefined") ? browser : chrome;

function fmt(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function badge(state) {
  if (state.reachable === true) return `<span class="badge ok">erreichbar</span>`;
  if (state.reachable === false) return `<span class="badge err">${state.error || "nicht erreichbar"}</span>`;
  return `<span class="badge unknown">noch nicht geprüft</span>`;
}

async function render() {
  const list = document.getElementById("list");
  const entries = await getEntries();
  const allState = await getAllState();

  if (!entries.length) {
    list.innerHTML = `<div class="empty">Keine Seiten konfiguriert. Über ⚙ hinzufügen.</div>`;
    return;
  }

  list.innerHTML = "";
  for (const entry of entries) {
    const st = allState[entry.id] || {};
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="label">${entry.label || entry.url}</div>
      <div class="url">${entry.url}</div>
      ${badge(st)}
      <div class="meta">
        Zuletzt geprüft: ${fmt(st.lastChecked)}<br>
        Letzte Änderung: ${fmt(st.lastChanged)}
      </div>
      <button data-id="${entry.id}">Jetzt prüfen</button>
    `;
    card.querySelector("button").addEventListener("click", async (e) => {
      const btn = e.target;
      btn.textContent = "Prüfe…";
      btn.disabled = true;
      await api.runtime.sendMessage({ type: "checkNow", id: entry.id });
      await render();
    });
    list.appendChild(card);
  }
}

document.getElementById("settings-btn").addEventListener("click", () => {
  api.runtime.openOptionsPage();
});

document.getElementById("check-all").addEventListener("click", async (e) => {
  e.target.textContent = "Prüfe alle…";
  e.target.disabled = true;
  await api.runtime.sendMessage({ type: "checkNow" });
  await render();
  e.target.textContent = "Alle jetzt prüfen";
  e.target.disabled = false;
});

render();
