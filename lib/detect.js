// Change detection utilities

// Compute SHA-256 hex of a string
export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Parse HTML string and extract text from selector, falling back to body
export function extractText(htmlString, selector) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Remove scripts and styles
  doc.querySelectorAll("script, style, noscript").forEach((el) => el.remove());

  let region = null;
  if (selector) {
    region = doc.querySelector(selector);
  }
  if (!region) {
    region = doc.body;
  }

  return region ? normalizeText(region.textContent) : "";
}

// Extract "letzte Änderung" timestamp if present
export function extractLastModified(htmlString) {
  const match = htmlString.match(
    /letzte\s+Änderung[:\s]+([0-9]{2}\.[0-9]{2}\.[0-9]{4}[^\n<"]{0,30}Uhr)/i
  );
  return match ? match[1].trim() : null;
}

// Extract page title
export function extractTitle(htmlString) {
  const match = htmlString.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

function normalizeText(text) {
  return text
    .replace(/\s+/g, " ")
    .trim();
}

// Simple line-based diff: returns { added, removed } lines
export function computeDiff(oldText, newText) {
  const oldLines = oldText.split(/\n|(?<=\. )/).map((l) => l.trim()).filter(Boolean);
  const newLines = newText.split(/\n|(?<=\. )/).map((l) => l.trim()).filter(Boolean);

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  const added = newLines.filter((l) => !oldSet.has(l));
  const removed = oldLines.filter((l) => !newSet.has(l));

  return {
    added: added.join("\n"),
    removed: removed.join("\n"),
    summary: `+${added.length} lines, -${removed.length} lines`,
  };
}
