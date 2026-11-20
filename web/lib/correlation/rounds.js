// Round generation for Guess the Correlation+. Pure and seeded: the same
// (seed, round number) always gives the same round, so a challenge link
// replays exactly. Every number shown to the player (r, r without the
// outlier, per-group r, ...) is computed from the generated points, never
// assumed from the generator's settings.

import { makeRng } from "../rng.js";
import { pearson, spearman, quadraticFit, diffs, mean, sd } from "./stats.js";

export const TRAP_KINDS = ["outlier", "simpson", "curve", "spurious"];

export const KIND_LABELS = {
  plain: "Straight read",
  outlier: "Outlier trap",
  simpson: "Simpson's paradox",
  curve: "Curve trap",
  spurious: "Spurious correlation",
};

const PLAIN_ROUNDS = 3;

// Which kind each round is. Rounds 1-3 are plain; after that a trap comes
// up with rising probability, never two in a row, and each trap kind is
// drawn from a shuffled bag so all four appear before any repeats.
export function roundKind(seed, index) {
  const rng = makeRng(`${seed}:plan`);
  let bag = [];
  let prevTrap = false;
  let kind = "plain";
  for (let i = 1; i <= index; i++) {
    const roll = rng.next();
    if (i <= PLAIN_ROUNDS || prevTrap) {
      kind = "plain";
    } else {
      const p = Math.min(0.55, 0.3 + 0.025 * (i - PLAIN_ROUNDS - 1));
      if (roll < p) {
        if (bag.length === 0) bag = rng.shuffle(TRAP_KINDS);
        kind = bag.pop();
      } else {
        kind = "plain";
      }
    }
    prevTrap = kind !== "plain";
  }
  return kind;
}

function correlatedCloud(rng, n, rho, { uniformX = false } = {}) {
  const pts = [];
  const k = Math.sqrt(Math.max(0, 1 - rho * rho));
  for (let i = 0; i < n; i++) {
    const x = uniformX ? rng.uniform(-1.7, 1.7) : rng.normal();
    pts.push({ x, y: rho * x + k * rng.normal() });
  }
  return pts;
}

const rOf = (pts) => pearson(pts.map((p) => p.x), pts.map((p) => p.y));

function plainRound(rng) {
  const n = rng.int(25, 120);
  const rho = rng.uniform(-0.97, 0.97);
  const points = correlatedCloud(rng, n, rho, { uniformX: rng.next() < 0.35 });
  return { points, reveal: {} };
}

function outlierRound(rng) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const n = rng.int(25, 50);
    const variant = rng.next() < 0.5 ? "creates" : "hides";
    const s = rng.sign();
    const rho = variant === "creates" ? rng.uniform(-0.12, 0.12) : s * rng.uniform(0.6, 0.85);
    const base = correlatedCloud(rng, n, rho);
    const xs = base.map((p) => p.x);
    const ys = base.map((p) => p.y);
    const k = rng.uniform(5, 8) + attempt * 0.2;
    const dir = variant === "creates" ? s : -s;
    const outlier = {
      x: mean(xs) + k * sd(xs),
      y: mean(ys) + dir * k * sd(ys),
      hl: true,
    };
    const rWithout = rOf(base);
    const points = [...base, outlier];
    const r = rOf(points);
    if (Math.abs(r - rWithout) < 0.35) continue;
    // Put the outlier at a random position so it isn't always drawn last.
    const at = rng.int(0, base.length);
    points.splice(at, 0, points.pop());
    return {
      variant,
      points,
      reveal: {
        rWithout,
        rho: spearman(points.map((p) => p.x), points.map((p) => p.y)),
        n: points.length,
      },
    };
  }
  throw new Error("outlier round: no layout found");
}

function simpsonRound(rng) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const groups = rng.int(3, 4);
    const s = rng.sign();
    const d = rng.uniform(2.6, 3.6);
    const w = rng.uniform(0.6, 0.85);
    const points = [];
    for (let g = 0; g < groups; g++) {
      const cx = g * d + rng.uniform(-0.3, 0.3);
      const cy = s * g * d + rng.uniform(-0.3, 0.3);
      const m = rng.int(12, 20);
      for (let i = 0; i < m; i++) {
        const dx = rng.normal();
        points.push({
          x: cx + dx,
          y: cy - s * w * dx + Math.sqrt(1 - w * w) * rng.normal(),
          g,
        });
      }
    }
    const r = rOf(points);
    const groupR = [];
    for (let g = 0; g < groups; g++) groupR.push(rOf(points.filter((p) => p.g === g)));
    if (Math.sign(r) !== s || Math.abs(r) < 0.3) continue;
    if (groupR.some((gr) => Math.sign(gr) !== -s || Math.abs(gr) < 0.35)) continue;
    return { points: rng.shuffle(points), reveal: { groupR } };
  }
  throw new Error("simpson round: no layout found");
}

function curveRound(rng) {
  const variant = rng.pick(["u", "cap", "ring"]);
  for (let attempt = 0; attempt < 100; attempt++) {
    const n = rng.int(40, 90);
    const points = [];
    if (variant === "ring") {
      for (let i = 0; i < n; i++) {
        const t = rng.uniform(0, 2 * Math.PI);
        const rad = 1 + 0.06 * rng.normal();
        points.push({ x: rad * Math.cos(t), y: rad * Math.sin(t) });
      }
    } else {
      const sign = variant === "u" ? 1 : -1;
      const noise = rng.uniform(0.03, 0.09);
      for (let i = 0; i < n; i++) {
        const x = rng.uniform(-1, 1);
        points.push({ x, y: sign * x * x + noise * rng.normal() });
      }
    }
    const r = rOf(points);
    if (Math.abs(r) > 0.12) continue;
    const reveal = {};
    if (variant !== "ring") {
      const fit = quadraticFit(points.map((p) => p.x), points.map((p) => p.y));
      reveal.curve = fit.coef;
      reveal.curveR2 = fit.r2;
    }
    return { variant, points, reveal };
  }
  throw new Error("curve round: no layout found");
}

// Made-up series, all invented for the game. `trend` is the direction the
// series drifts over time.
const SERIES = [
  { name: "Oat milk sold (million L)", base: 40, step: 3.2, trend: 1 },
  { name: "Drone pilot licences issued (k)", base: 12, step: 1.1, trend: 1 },
  { name: "Podcast episodes released (k)", base: 80, step: 9, trend: 1 },
  { name: "Bubble tea shops in town", base: 30, step: 4, trend: 1 },
  { name: "Marathon finishers (k)", base: 18, step: 0.9, trend: 1 },
  { name: "Fax machines in use (k)", base: 900, step: 38, trend: -1 },
  { name: "Library late fees collected ($k)", base: 260, step: 9, trend: -1 },
  { name: "Landline phone bills mailed (k)", base: 500, step: 21, trend: -1 },
  { name: "Smart-fridge sales (k)", base: 5, step: 0.8, trend: 1 },
  { name: "Cassette tapes sold (k)", base: 350, step: 14, trend: -1 },
];

function makeSeries(rng, def, years) {
  const noise = def.step * rng.uniform(0.9, 1.6);
  const out = [];
  for (let t = 0; t < years; t++) {
    out.push(Math.max(0, def.base + def.trend * def.step * t + noise * rng.normal()));
  }
  return out;
}

function spuriousRound(rng) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const [a, b] = rng.shuffle(SERIES);
    const years = rng.int(14, 22);
    const start = rng.int(1996, 2004);
    const A = makeSeries(rng, a, years);
    const B = makeSeries(rng, b, years);
    const r = pearson(A, B);
    const rDiff = pearson(diffs(A), diffs(B));
    if (Math.abs(r) < 0.75 || Math.abs(rDiff) > 0.25) continue;
    return {
      points: A.map((x, i) => ({ x, y: B[i] })),
      labels: { x: a.name, y: b.name },
      reveal: { years: A.map((_, i) => start + i), A, B, rDiff },
    };
  }
  throw new Error("spurious round: no layout found");
}

const GENERATORS = {
  plain: plainRound,
  outlier: outlierRound,
  simpson: simpsonRound,
  curve: curveRound,
  spurious: spuriousRound,
};

// Round `index` (1-based) of the game with this seed. Pass `kind` to force
// one (used by tests and the practice picker).
export function makeRound(seed, index, kind = roundKind(seed, index)) {
  const rng = makeRng(`${seed}:round:${index}:${kind}`);
  const made = GENERATORS[kind](rng);
  const points = made.points;
  return {
    index,
    kind,
    variant: made.variant ?? null,
    points,
    labels: made.labels ?? null,
    r: rOf(points),
    reveal: made.reveal,
  };
}
