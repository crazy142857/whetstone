// Scoring for Guess the Correlation+. Pure.

export const START_LIVES = 3;
export const MAX_LIVES = 3;

// How a guess grades, by absolute error.
export function grade(error) {
  if (error <= 0.05) return "bullseye";
  if (error <= 0.1) return "close";
  if (error <= 0.25) return "off";
  return "miss";
}

export const GRADE_LABELS = {
  bullseye: "Bullseye",
  close: "Close",
  off: "Off",
  miss: "Miss",
};

// Score one guess against the current state. Returns the round result and
// the next state. State: { score, lives, streak, bestStreak }.
//  - Base points: 100 at a perfect guess, falling linearly to 0 at 0.4 off.
//  - Streak: consecutive guesses within 0.10. Each streak step adds 10% to
//    that round's points, up to double.
//  - A miss (more than 0.25 off) costs a life; a bullseye wins one back,
//    up to the starting three.
export function scoreGuess(state, guess, r) {
  const error = Math.abs(guess - r);
  const g = grade(error);
  const base = Math.max(0, Math.round(100 * (1 - error / 0.4)));
  const streak = g === "bullseye" || g === "close" ? state.streak + 1 : 0;
  const multiplier = 1 + 0.1 * Math.min(streak, 10);
  const points = Math.round(base * multiplier);
  let lives = state.lives;
  if (g === "miss") lives -= 1;
  if (g === "bullseye" && lives < MAX_LIVES) lives += 1;
  return {
    result: { guess, r, error, grade: g, base, multiplier, points, lifeLost: g === "miss", lifeWon: lives > state.lives },
    state: {
      score: state.score + points,
      lives,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
    },
  };
}

export function initialState() {
  return { score: 0, lives: START_LIVES, streak: 0, bestStreak: 0 };
}

// Summary of a finished game from its round results.
export function summarize(results) {
  const byKind = {};
  for (const res of results) {
    const k = (byKind[res.kind] ||= { rounds: 0, totalError: 0, misses: 0 });
    k.rounds += 1;
    k.totalError += res.error;
    if (res.grade === "miss") k.misses += 1;
  }
  for (const k of Object.values(byKind)) k.avgError = k.totalError / k.rounds;
  const totalError = results.reduce((s, r) => s + r.error, 0);
  return {
    rounds: results.length,
    avgError: results.length ? totalError / results.length : 0,
    bullseyes: results.filter((r) => r.grade === "bullseye").length,
    byKind,
  };
}
