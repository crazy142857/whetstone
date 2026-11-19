// Plain statistics on arrays of numbers. Pure, no dependencies.

export function mean(xs) {
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function sd(xs) {
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) ** 2;
  return Math.sqrt(s / xs.length);
}

// Pearson's r. Returns 0 when either side has no variance.
export function pearson(xs, ys) {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return 0;
  return sxy / Math.sqrt(sxx * syy);
}

// Average ranks (ties share the mean rank), 1-based.
export function ranks(xs) {
  const order = xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(xs.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const rank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[order[k][1]] = rank;
    i = j + 1;
  }
  return out;
}

export function spearman(xs, ys) {
  return pearson(ranks(xs), ranks(ys));
}

// Least-squares line y = a + b x.
export function linearFit(xs, ys) {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  const b = sxx === 0 ? 0 : sxy / sxx;
  return { a: my - b * mx, b };
}

// Least-squares parabola y = c0 + c1 x + c2 x^2, plus its R^2.
export function quadraticFit(xs, ys) {
  const n = xs.length;
  const s = [0, 0, 0, 0, 0];
  const t = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    let p = 1;
    for (let k = 0; k < 5; k++) {
      s[k] += p;
      if (k < 3) t[k] += p * ys[i];
      p *= xs[i];
    }
  }
  const m = [
    [s[0], s[1], s[2], t[0]],
    [s[1], s[2], s[3], t[1]],
    [s[2], s[3], s[4], t[2]],
  ];
  // Gaussian elimination with partial pivoting.
  for (let c = 0; c < 3; c++) {
    let p = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    [m[c], m[p]] = [m[p], m[c]];
    for (let r = c + 1; r < 3; r++) {
      const f = m[r][c] / m[c][c];
      for (let k = c; k < 4; k++) m[r][k] -= f * m[c][k];
    }
  }
  const coef = [0, 0, 0];
  for (let r = 2; r >= 0; r--) {
    let v = m[r][3];
    for (let k = r + 1; k < 3; k++) v -= m[r][k] * coef[k];
    coef[r] = v / m[r][r];
  }
  const my = mean(ys);
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const f = coef[0] + coef[1] * xs[i] + coef[2] * xs[i] ** 2;
    ssRes += (ys[i] - f) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  return { coef, r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot };
}

export function diffs(xs) {
  const out = [];
  for (let i = 1; i < xs.length; i++) out.push(xs[i] - xs[i - 1]);
  return out;
}
