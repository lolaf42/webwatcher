import { loadAll, loadState } from "../lib/storage.js";

function fmt(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function statusBadge(state) {
  if (!state) return `<span class="badge badge-unk">never checked</span>`;
  if (state.reachable === false) return `<span class="badge badge-err">unreachable</span>`;
  return `<span class="badge badge-ok">OK</span>`;
}

async function renderEntries() {
  const { entries } = await loadAll();
  const list = document.getElementById("entry-list");
  const emptyHint = document.getElementById("empty-hint");

  if (!entries.length) {
    list.innerHTML = "";
    emptyHint.classList.remove("hidden");
    return;
  }
  emptyHint.classList.add("hidden");

  const cards = await Promise.all(
    entries.map(async (entry) => {
      const state = await loadState(entry.id);
      return { entry, state };
    })
  );

  list.innerHTML = "";
  for (const { entry, state } of cards) {
    const card = document.createElement("div");
    card.className = "entry-card";
    card.dataset.id = entry.id;

    const errorLine = state?.error
      ? `<div class="entry-meta"><span class="key">Error</span><span class="val" style="color:var(--err)">${escHtml(state.error)}</span></div>`
      : "";

    const tsMod = state?.lastModified
      ? `<span class="key">Page date</span><span class="val">${escHtml(state.lastModified)}</span>`
      : "";

    card.innerHTML = `
      <div class="entry-label">${escHtml(entry.label || entry.url)}</div>
      <div class="entry-url">${escHtml(entry.url)}</div>
      <div class="entry-meta">
        <span class="key">Status</span><span class="val">${statusBadge(state)}</span>
        <span class="key">Last checked</span><span class="val">${fmt(state?.lastChecked)}</span>
        <span class="key">Last changed</span><span class="val">${fmt(state?.lastChanged)}</span>
        ${tsMod}
        <span class="key">Interval</span><span class="val">${entry.intervalMinutes} min</span>
      </div>
      ${errorLine}
      <button class="btn-check" data-id="${entry.id}">Check now</button>
      <div class="checking-msg hidden" id="msg-${entry.id}"></div>
    `;
    list.appendChild(card);
  }

  list.querySelectorAll(".btn-check").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const msg = document.getElementById(`msg-${id}`);
      btn.disabled = true;
      msg.textContent = "Checking…";
      msg.classList.remove("hidden");

      const result = await browser.runtime.sendMessage({ type: "CHECK_NOW", entryId: id });

      if (result?.error) {
        msg.textContent = `Error: ${result.error}`;
      } else if (result?.changed) {
        msg.textContent = `Change detected! ${result.diff?.summary ?? ""}`;
      } else {
        msg.textContent = "No change detected.";
      }

      btn.disabled = false;
      // Refresh card data
      await renderEntries();
    });
  });
}

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.getElementById("open-options").addEventListener("click", (e) => {
  e.preventDefault();
  browser.runtime.openOptionsPage();
});

document.addEventListener("click", (e) => {
  if (e.target.id === "go-options") {
    e.preventDefault();
    browser.runtime.openOptionsPage();
  }
});

renderEntries();
