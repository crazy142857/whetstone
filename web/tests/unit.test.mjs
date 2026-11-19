import test from "node:test";
import assert from "node:assert/strict";
import { makeRng } from "../lib/correlation/rng.js";
import { pearson, spearman, quadraticFit, ranks } from "../lib/correlation/stats.js";
import { makeRound, roundKind, TRAP_KINDS } from "../lib/correlation/rounds.js";
import { scoreGuess, initialState, grade, summarize } from "../lib/correlation/scoring.js";
import { explainRound, fmt } from "../lib/correlation/explain.js";

const SEEDS = Array.from({ length: 40 }, (_, i) => `seed-${i}`);
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const rOf = (pts) => pearson(pts.map((p) => p.x), pts.map((p) => p.y));

test("rng is deterministic per seed", () => {
  const a = makeRng("x");
  const b = makeRng("x");
  for (let i = 0; i < 10; i++) assert.equal(a.next(), b.next());
  assert.notEqual(makeRng("x").next(), makeRng("y").next());
});

test("pearson, spearman, ranks, quadratic fit", () => {
  assert.ok(close(pearson([1, 2, 3], [2, 4, 6]), 1));
  assert.ok(close(pearson([1, 2, 3], [3, 2, 1]), -1));
  assert.equal(pearson([1, 1, 1], [1, 2, 3]), 0);
  assert.deepEqual(ranks([10, 20, 20, 5]), [2, 3.5, 3.5, 1]);
  assert.ok(close(spearman([1, 2, 3, 4], [1, 8, 27, 64]), 1));
  const xs = [-2, -1, 0, 1, 2];
  const fit = quadraticFit(xs, xs.map((x) => 3 + 2 * x + x * x));
  assert.ok(close(fit.coef[0], 3, 1e-6) && close(fit.coef[1], 2, 1e-6) && close(fit.coef[2], 1, 1e-6));
  assert.ok(close(fit.r2, 1, 1e-9));
});

test("rounds are deterministic and r matches the points", () => {
  for (const seed of SEEDS.slice(0, 5)) {
    for (let i = 1; i <= 15; i++) {
      const a = makeRound(seed, i);
      const b = makeRound(seed, i);
      assert.deepEqual(a, b);
      assert.ok(close(a.r, rOf(a.points)));
      assert.ok(a.r >= -1 && a.r <= 1);
    }
  }
});

test("schedule: three plain rounds, no back-to-back traps, every trap appears", () => {
  const seen = new Set();
  for (const seed of SEEDS) {
    let prev = "plain";
    for (let i = 1; i <= 25; i++) {
      const k = roundKind(seed, i);
      if (i <= 3) assert.equal(k, "plain");
      if (prev !== "plain") assert.equal(k, "plain");
      seen.add(k);
      prev = k;
    }
  }
  for (const k of TRAP_KINDS) assert.ok(seen.has(k), k);
});

test("outlier rounds: one highlighted point swings r by at least 0.35", () => {
  for (const seed of SEEDS) {
    const round = makeRound(seed, 5, "outlier");
    const hl = round.points.filter((p) => p.hl);
    assert.equal(hl.length, 1);
    const without = round.points.filter((p) => !p.hl);
    assert.ok(close(round.reveal.rWithout, rOf(without)));
    assert.ok(Math.abs(round.r - round.reveal.rWithout) >= 0.35);
    assert.equal(round.reveal.n, round.points.length);
  }
});

test("simpson rounds: pooled r and every group's r have opposite signs", () => {
  for (const seed of SEEDS) {
    const round = makeRound(seed, 5, "simpson");
    const groups = new Set(round.points.map((p) => p.g));
    assert.equal(groups.size, round.reveal.groupR.length);
    round.reveal.groupR.forEach((gr, g) => {
      assert.ok(close(gr, rOf(round.points.filter((p) => p.g === g))));
      assert.equal(Math.sign(gr), -Math.sign(round.r));
    });
    assert.ok(Math.abs(round.r) >= 0.3);
  }
});

test("curve rounds: |r| is small, parabola fits well", () => {
  for (const seed of SEEDS) {
    const round = makeRound(seed, 5, "curve");
    assert.ok(Math.abs(round.r) <= 0.12);
    if (round.variant !== "ring") assert.ok(round.reveal.curveR2 > 0.7, String(round.reveal.curveR2));
  }
});

test("spurious rounds: strong r, weak r on year-to-year changes", () => {
  for (const seed of SEEDS) {
    const round = makeRound(seed, 5, "spurious");
    assert.ok(Math.abs(round.r) >= 0.75);
    assert.ok(Math.abs(round.reveal.rDiff) <= 0.25);
    assert.equal(round.reveal.years.length, round.points.length);
    assert.ok(round.labels.x && round.labels.y);
  }
});

test("scoring: grades, streak multiplier, lives", () => {
  assert.equal(grade(0.05), "bullseye");
  assert.equal(grade(0.1), "close");
  assert.equal(grade(0.25), "off");
  assert.equal(grade(0.26), "miss");
  let s = initialState();
  let out = scoreGuess(s, 0.5, 0.5);
  assert.equal(out.result.points, 110);
  assert.equal(out.state.lives, 3);
  out = scoreGuess(out.state, 0.5, 0.42);
  assert.equal(out.state.streak, 2);
  assert.equal(out.result.points, Math.round(80 * 1.2));
  out = scoreGuess(out.state, -0.5, 0.5);
  assert.equal(out.result.points, 0);
  assert.equal(out.state.lives, 2);
  assert.equal(out.state.streak, 0);
  assert.equal(out.state.bestStreak, 2);
  out = scoreGuess(out.state, 0.5, 0.5);
  assert.equal(out.state.lives, 3);
  assert.ok(out.result.lifeWon);
  const sum = summarize([
    { kind: "plain", error: 0.1, grade: "close" },
    { kind: "outlier", error: 0.5, grade: "miss" },
  ]);
  assert.equal(sum.rounds, 2);
  assert.ok(close(sum.avgError, 0.3));
  assert.equal(sum.byKind.outlier.misses, 1);
});

test("explainers quote the round's own numbers", () => {
  for (const seed of SEEDS.slice(0, 10)) {
    for (const kind of ["plain", ...TRAP_KINDS]) {
      const round = makeRound(seed, 6, kind);
      const ex = explainRound(round, 0.3);
      const text = ex.paragraphs.join(" ");
      assert.ok(ex.title.length > 0);
      if (kind === "outlier") assert.ok(text.includes(fmt(round.reveal.rWithout)));
      if (kind === "simpson") assert.ok(text.includes(fmt(round.reveal.groupR[0])));
      if (kind === "spurious") assert.ok(text.includes(fmt(round.reveal.rDiff)));
      if (kind === "curve") assert.ok(text.includes(fmt(round.r)));
    }
  }
});
