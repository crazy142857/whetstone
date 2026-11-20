// Per-device game history in localStorage, one list per game. Every access
// is guarded: storage can be missing or throw (private windows, blocked
// site data). The correlation key predates the others and keeps its name.

const LIMIT = 200;
const key = (game) => `whetstone:${game}:games`;

export function loadGames(game = "correlation") {
  try {
    const raw = window.localStorage.getItem(key(game));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveGame(record, game = "correlation") {
  try {
    const list = [record, ...loadGames(game)].slice(0, LIMIT);
    window.localStorage.setItem(key(game), JSON.stringify(list));
  } catch {
    // Not saved; the game itself still works.
  }
}

export function bestScore(games = loadGames()) {
  return games.reduce((m, g) => Math.max(m, g.score || 0), 0);
}

// Field-guide lessons met in the AI security games: { lessonId: { rounds, points } }.
export function lessonTotals(gameSlugs) {
  const acc = {};
  for (const slug of gameSlugs) {
    for (const g of loadGames(slug)) {
      for (const [id, l] of Object.entries(g.byLesson || {})) {
        const a = (acc[id] ||= { rounds: 0, points: 0 });
        a.rounds += l.rounds;
        a.points += l.points;
      }
    }
  }
  return acc;
}
