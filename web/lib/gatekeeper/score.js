// Gatekeeper scoring. Pure. Full marks for the right call; partial credit
// for a safe-but-imperfect one; nothing for letting a risky action run.
//   right answer ->   allow  ask  block
//   chose allow         100    0      0
//   chose ask            60  100     40   (an approval prompt is the last line of defence, and people click through them)
//   chose block          20   50    100   (safe, but it stopped real work)

import { SCENARIOS } from "./scenarios.js";
import { dealDeck } from "../security/deck.js";

export const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

const POINTS = {
  allow: { allow: 100, ask: 0, block: 0 },
  ask: { allow: 60, ask: 100, block: 40 },
  block: { allow: 20, ask: 50, block: 100 },
};

export function scoreGate(scenario, choice) {
  const points = POINTS[choice][scenario.answer];
  let verdict;
  if (points === 100) verdict = "Right call";
  else if (choice === "allow") verdict = "That ran";
  else if (scenario.answer === "allow") verdict = "Safe, but in the way";
  else verdict = "Close";
  return { points, choice, verdict };
}

// Every game has at least one action of each kind, so all three buttons
// get a turn.
export function dealGate(seed) {
  return dealDeck(seed, SCENARIOS, {
    salt: "gatekeeper",
    accept: (deck) => ["allow", "ask", "block"].every((a) => deck.some((id) => byId[id].answer === a)),
  });
}
