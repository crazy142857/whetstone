// Browser smoke test: plays a full game against a running server
// (BASE_URL, default http://127.0.0.1:3008), checks every round type
// renders its reveal, and saves screenshots to SHOTS (default ./shots).
//   npx next build && npx next start -p 3008 &   then   npm run test:e2e
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import { makeRound, roundKind } from "../lib/correlation/rounds.js";
import { fmt } from "../lib/correlation/explain.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3008";
const SHOTS = process.env.SHOTS || "shots";
mkdirSync(SHOTS, { recursive: true });

// A seed whose first trap rounds cover all four kinds early.
function findSeed() {
  for (let i = 0; i < 5000; i++) {
    const seed = `e2e${i}`;
    const kinds = new Set();
    for (let r = 1; r <= 12; r++) kinds.add(roundKind(seed, r));
    if (kinds.size === 5) return seed;
  }
  throw new Error("no seed");
}

const seed = findSeed();
const browser = await chromium.launch();
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + "/");
  await page.getByRole("heading", { name: "Keep your instincts sharp." }).waitFor();
  await page.screenshot({ path: `${SHOTS}/hub.png` });

  await page.goto(`${BASE}/correlation?seed=${seed}`);
  await page.getByRole("button", { name: "Play the challenge" }).click();
  const seen = new Set();
  let index = 1;
  for (; index <= 12; index++) {
    const round = makeRound(seed, index);
    const slider = page.getByLabel("Guess for r");
    await slider.waitFor();
    // Guess within 0.03 so the game survives, except on round 2 (a miss).
    const guess = index === 2 ? (round.r > 0 ? -0.9 : 0.9) : Math.max(-1, Math.min(1, Math.round((round.r + 0.03) * 100) / 100));
    await slider.fill(String(guess));
    if (index === 1) await page.screenshot({ path: `${SHOTS}/guess.png` });
    await page.keyboard.press("Enter");
    await page.getByText("What just happened").waitFor();
    assert.equal(await page.getByTestId("actual").textContent(), fmt(round.r), `round ${index} r`);
    if (!seen.has(round.kind)) {
      seen.add(round.kind);
      await page.screenshot({ path: `${SHOTS}/reveal-${round.kind}.png`, fullPage: true });
    }
    if (seen.size === 5) break;
    await page.getByRole("button", { name: "Next round" }).click();
  }
  assert.equal(seen.size, 5, `saw ${[...seen]}`);

  // Now miss until the game ends.
  for (let lives = 0; lives < 5; lives++) {
    const btn = page.getByRole("button", { name: /Next round|See results/ });
    const label = await btn.textContent();
    await btn.click();
    if (label === "See results") break;
    const r = makeRound(seed, ++index).r;
    await page.getByLabel("Guess for r").fill(r > 0 ? "-1" : "1");
    await page.getByRole("button", { name: "Lock in" }).click();
  }
  await page.getByText("Game over").waitFor();
  await page.screenshot({ path: `${SHOTS}/game-over.png`, fullPage: true });

  await page.goto(BASE + "/stats");
  await page.getByText("By round type").waitFor();
  await page.screenshot({ path: `${SHOTS}/stats.png`, fullPage: true });

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  phone.on("pageerror", (e) => errors.push(String(e)));
  await phone.goto(`${BASE}/correlation?seed=${seed}`);
  await phone.getByRole("button", { name: "Play the challenge" }).click();
  await phone.getByLabel("Guess for r").fill("0.5");
  await phone.getByRole("button", { name: "Lock in" }).click();
  await phone.getByText("What just happened").waitFor();
  await phone.screenshot({ path: `${SHOTS}/phone-reveal.png`, fullPage: true });
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false, "horizontal scroll on phone");

  assert.deepEqual(errors, []);
  console.log(`ok: seed ${seed}, rounds played ${index}, round types ${[...seen].join(", ")}`);
} finally {
  await browser.close();
}
