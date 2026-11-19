// Per-device game history in localStorage. Every access is guarded: storage
// can be missing or throw (private windows, blocked site data).

const KEY = "whetstone:correlation:games";
const LIMIT = 200;

export function loadGames() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveGame(game) {
  try {
    const list = [game, ...loadGames()].slice(0, LIMIT);
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Not saved; the game itself still works.
  }
}

export function bestScore(games = loadGames()) {
  return games.reduce((m, g) => Math.max(m, g.score || 0), 0);
}
