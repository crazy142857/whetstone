// "What just happened" text for each round, built from the round's own
// numbers and the player's guess. Pure, so tests can check that every
// figure quoted matches the data.

export const fmt = (r) => (r < 0 ? "−" : "") + Math.abs(r).toFixed(2);
const pct = (x) => `${Math.round(x * 100)}%`;

function guessLine(guess, r) {
  const err = Math.abs(guess - r);
  if (err <= 0.05) return `You said ${fmt(guess)}: within 0.05 of the real ${fmt(r)}.`;
  const dir = guess > r ? "high" : "low";
  let line = `You said ${fmt(guess)}, ${err.toFixed(2)} too ${dir}.`;
  if (Math.sign(guess) !== Math.sign(r) && Math.abs(r) >= 0.15 && Math.abs(guess) >= 0.1) {
    line += " The sign was the wrong way round.";
  }
  return line;
}

function plainTip(r) {
  const a = Math.abs(r);
  const r2 = pct(r * r);
  if (a >= 0.9)
    return `Near-lines are where small gaps hide big differences: r = 0.90 means a straight line explains 81% of the variation in y, r = 0.99 explains 98%. Here it's ${r2}.`;
  if (a >= 0.6)
    return `r² is the share of y's variation a straight line explains: ${r2} here. Even a correlation this clear leaves ${pct(1 - r * r)} of the scatter unexplained.`;
  if (a >= 0.3)
    return `Moderate correlations are the ones eyes most often misjudge. A line explains only ${r2} of the variation here, yet the trend is real.`;
  return `Below about 0.3 a scatter plot looks like noise to most people. r² here is ${r2}: knowing x tells you almost nothing about y.`;
}

export function explainRound(round, guess) {
  const { kind, r, reveal } = round;
  const you = guessLine(guess, r);

  if (kind === "outlier") {
    const swing = r - reveal.rWithout;
    return {
      title: "One point moved the whole number",
      paragraphs: [
        you,
        `Take away the highlighted point and r is ${fmt(reveal.rWithout)}. One point out of ${reveal.n} shifted it by ${Math.abs(swing).toFixed(2)}.`,
        round.variant === "creates"
          ? "The rest of the cloud has no trend at all. Pearson's r squares each point's distance from the mean, so a single far-out point can manufacture a correlation."
          : `The rest of the cloud has a clear trend, and one far-out point ${Math.sign(r) !== Math.sign(reveal.rWithout) ? "flipped its sign" : "drowned it"}. Pearson's r squares each point's distance from the mean, so a single extreme point can outweigh dozens of ordinary ones.`,
        `Spearman's rank correlation, which only looks at the order of the values, is ${fmt(reveal.rho)} here. When one point is doing the talking, check it, and report a measure that doesn't lean on it.`,
      ],
    };
  }

  if (kind === "simpson") {
    const groups = reveal.groupR.map(fmt).join(", ");
    return {
      title: "Simpson's paradox: the trend flips inside every group",
      paragraphs: [
        you,
        `Pooled together, r is ${fmt(r)}. Colour the points by group and each group runs the other way: r = ${groups}.`,
        "The groups sit at different levels, and that difference between groups drives the pooled trend. Within any one group, the relationship is the opposite.",
        "Before trusting a pooled correlation, ask what the data mixes together: teams, regions, time periods, customer types.",
      ],
    };
  }

  if (kind === "curve") {
    const paras = [you];
    if (round.variant === "ring") {
      paras.push(
        `The points sit on a circle, so x tells you a lot about y (it narrows y to two values), yet r is ${fmt(r)}.`,
      );
    } else {
      paras.push(
        `y follows x almost perfectly along a curve: a parabola explains ${pct(reveal.curveR2)} of the variation. But r is ${fmt(r)}, because the curve goes ${round.variant === "u" ? "down then up" : "up then down"} and the two halves cancel out.`,
      );
    }
    paras.push(
      "r only measures straight-line relationships. A value near zero means there is no straight-line trend, not that there's no relationship. Always look at the plot.",
    );
    return { title: "A strong pattern with r near zero", paragraphs: paras };
  }

  if (kind === "spurious") {
    return {
      title: "A spurious correlation",
      paragraphs: [
        you,
        `These two made-up series correlate at ${fmt(r)}, but they have nothing to do with each other. Each one just drifts ${r > 0 ? "the same way" : "in opposite directions"} over the same ${reveal.years.length} years.`,
        `Correlate the year-to-year changes instead and r drops to ${fmt(reveal.rDiff)}. Any two series that trend over time will correlate; that alone says nothing about a link.`,
        "With time series, compare changes (or remove the trend) before reading anything into r.",
      ],
    };
  }

  return { title: "Straight read", paragraphs: [you, plainTip(r)] };
}
