// Shared by the AI security games: which scenarios a game deals, and the
// end-of-game summary. Pure and seeded, so a challenge link deals the same
// cards in the same order.

import { makeRng } from "../rng.js";

export const ROUNDS_PER_GAME = 8;

// Deal `n` scenario ids for a seed. `accept(deck)` can reject a deal (e.g.
// "at least one clean round"); rejected deals are redrawn from the same
// seeded stream, so the result is still deterministic.
export function dealDeck(seed, items, { n = ROUNDS_PER_GAME, accept = () => true, salt = "deck" } = {}) {
  const rng = makeRng(`${seed}:${salt}`);
  const ids = items.map((s) => s.id);
  let deck = rng.shuffle(ids).slice(0, n);
  for (let tries = 0; tries < 200 && !accept(deck); tries++) deck = rng.shuffle(ids).slice(0, n);
  return deck;
}

// results: [{ points, lesson }] -> totals plus points by lesson.
export function summarizeDeck(results) {
  const byLesson = {};
  for (const r of results) {
    const l = (byLesson[r.lesson] ||= { rounds: 0, points: 0 });
    l.rounds += 1;
    l.points += r.points;
  }
  const score = results.reduce((s, r) => s + r.points, 0);
  return {
    rounds: results.length,
    score,
    maxScore: results.length * 100,
    perfect: results.filter((r) => r.points === 100).length,
    byLesson,
  };
}
