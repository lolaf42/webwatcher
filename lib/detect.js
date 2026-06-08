// lib/detect.js — Inhaltsextraktion, Hashing, Zeitstempel und Diff

// SHA-256 eines Strings, hex-codiert
export async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Extrahiert den sichtbaren Text aus dem HTML, optional begrenzt auf einen CSS-Selektor.
// Fällt auf <body> zurück, wenn der Selektor nichts trifft.
export function extractText(html, selector) {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Stör-Elemente entfernen
  doc.querySelectorAll("script, style, noscript, template").forEach(el => el.remove());

  let root = null;
  if (selector) {
    try {
      root = doc.querySelector(selector);
    } catch (e) {
      root = null; // ungültiger Selektor -> Fallback
    }
  }
  if (!root) root = doc.body;
  if (!root) return "";

  // Text normalisieren: Whitespace zusammenfassen
  return root.textContent.replace(/\s+/g, " ").trim();
}

// Liest "letzte Änderung: 30.04.2026 14:48:00 Uhr" o.ä. aus dem HTML
export function extractLastModified(html) {
  const m = html.match(/letzte\s+Änderung:\s*([0-9]{2}\.[0-9]{2}\.[0-9]{4}\s+[0-9]{2}:[0-9]{2}(?::[0-9]{2})?)/i);
  return m ? m[1].trim() : null;
}

// Einfacher zeilenbasierter Diff: gibt hinzugekommene Textstücke zurück
export function computeDiff(oldText, newText) {
  if (!oldText) return newText.slice(0, 1000);
  const oldWords = new Set(oldText.split(" "));
  const added = newText.split(" ").filter(w => !oldWords.has(w));
  return added.join(" ").slice(0, 1000);
}
