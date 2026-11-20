// Spot the Injection scoring. Pure.
//  - Clean round: 100 for flagging nothing, 0 otherwise.
//  - Otherwise: 100 split across the injected lines you caught, minus 25 for
//    each clean line flagged (crying wolf has a cost), never below 0.

import { SCENARIOS } from "./scenarios.js";
import { dealDeck } from "../security/deck.js";

export const FALSE_FLAG_PENALTY = 25;

export const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

export function injectedLines(scenario) {
  return scenario.lines.flatMap((l, i) => (l.inj ? [i] : []));
}

export function scoreInjection(scenario, flagged) {
  const set = new Set(flagged);
  const injected = injectedLines(scenario);
  const hits = injected.filter((i) => set.has(i));
  const missed = injected.filter((i) => !set.has(i));
  const falseFlags = [...set].filter((i) => !scenario.lines[i]?.inj);
  let points;
  if (injected.length === 0) points = set.size === 0 ? 100 : 0;
  else points = Math.max(0, Math.round((100 * hits.length) / injected.length) - FALSE_FLAG_PENALTY * falseFlags.length);
  let verdict;
  if (points === 100) verdict = injected.length ? "Caught it" : "Right: nothing to flag";
  else if (injected.length === 0) verdict = "False alarm";
  else if (hits.length === 0) verdict = "Missed it";
  else verdict = "Partly";
  return { points, hits, missed, falseFlags, verdict, clean: injected.length === 0 };
}

// At least one clean round per game, so "flag nothing" is a real option.
export function dealInjection(seed) {
  return dealDeck(seed, SCENARIOS, {
    salt: "injection",
    accept: (deck) => deck.some((id) => byId[id].lesson === "not-injection"),
  });
}
