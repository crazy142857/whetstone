// Crack the Codename progress on this device: highest level unlocked and
// the best result per level. Guarded like history.js.

const KEY = "whetstone:codename:progress";

export function loadProgress() {
  try {
    const p = JSON.parse(window.localStorage.getItem(KEY) || "null");
    if (p && typeof p.unlocked === "number" && p.best && typeof p.best === "object") return p;
  } catch {
    // fall through
  }
  return { unlocked: 1, best: {} };
}

export function saveProgress(p) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Not saved; the game still works.
  }
}
