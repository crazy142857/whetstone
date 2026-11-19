"use client";

import { linearFit } from "@/lib/correlation/stats";

const SIZE = 480;
const GROUP_COLORS = ["var(--g0)", "var(--g1)", "var(--g2)", "var(--g3)"];

function bounds(values) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const pad = (hi - lo || 1) * 0.08;
  return [lo - pad, hi + pad];
}

function fitLine(pts, sx, sy, xRange) {
  const { a, b } = linearFit(pts.map((p) => p.x), pts.map((p) => p.y));
  const [x0, x1] = xRange;
  return { x1: sx(x0), y1: sy(a + b * x0), x2: sx(x1), y2: sy(a + b * x1) };
}

// The round's scatter plot. Before the guess it shows plain dots (traps
// look like any other round); with `revealed` it adds the explanation's
// overlays: best-fit lines, the outlier, group colours, the curve.
export default function ScatterPlot({ round, revealed }) {
  const { points, kind, reveal, labels } = round;
  const hasLabels = Boolean(labels);
  const m = { l: hasLabels ? 34 : 14, r: 14, t: 14, b: hasLabels ? 34 : 14 };
  const [xLo, xHi] = bounds(points.map((p) => p.x));
  const [yLo, yHi] = bounds(points.map((p) => p.y));
  const w = SIZE - m.l - m.r;
  const h = SIZE - m.t - m.b;
  const sx = (x) => m.l + ((x - xLo) / (xHi - xLo)) * w;
  const sy = (y) => m.t + h - ((y - yLo) / (yHi - yLo)) * h;
  const dotR = points.length > 90 ? 4 : 5;

  const overlays = [];
  if (revealed) {
    if (kind === "simpson") {
      const groups = reveal.groupR.length;
      for (let g = 0; g < groups; g++) {
        const gp = points.filter((p) => p.g === g);
        const gx = gp.map((p) => p.x);
        const l = fitLine(gp, sx, sy, [Math.min(...gx), Math.max(...gx)]);
        overlays.push(<line key={`g${g}`} {...l} stroke={GROUP_COLORS[g]} strokeWidth="3" />);
      }
      overlays.push(
        <line key="all" {...fitLine(points, sx, sy, [xLo, xHi])} stroke="var(--ink-3)" strokeWidth="2" strokeDasharray="6 5" />,
      );
    } else if (kind === "outlier") {
      const rest = points.filter((p) => !p.hl);
      overlays.push(
        <line key="with" {...fitLine(points, sx, sy, [xLo, xHi])} stroke="var(--bad)" strokeWidth="2.5" strokeDasharray="6 5" />,
        <line key="without" {...fitLine(rest, sx, sy, [xLo, xHi])} stroke="var(--good)" strokeWidth="2.5" />,
      );
    } else if (kind === "curve" && reveal.curve) {
      const [c0, c1, c2] = reveal.curve;
      const steps = 60;
      const d = Array.from({ length: steps + 1 }, (_, i) => {
        const x = xLo + ((xHi - xLo) * i) / steps;
        return `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(c0 + c1 * x + c2 * x * x).toFixed(1)}`;
      }).join(" ");
      overlays.push(
        <path key="curve" d={d} fill="none" stroke="var(--good)" strokeWidth="3" />,
        <line key="lin" {...fitLine(points, sx, sy, [xLo, xHi])} stroke="var(--ink-3)" strokeWidth="2" strokeDasharray="6 5" />,
      );
    } else {
      overlays.push(
        <line key="lin" {...fitLine(points, sx, sy, [xLo, xHi])} stroke="var(--accent)" strokeWidth="2.5" strokeDasharray={kind === "plain" ? undefined : "6 5"} />,
      );
    }
  }

  const fillFor = (p) => {
    if (revealed && kind === "simpson") return GROUP_COLORS[p.g];
    if (revealed && kind === "outlier" && p.hl) return "var(--bad)";
    return "var(--dot)";
  };

  const grid = [0.25, 0.5, 0.75];
  return (
    <svg className="plot" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Scatter plot of ${points.length} points`}>
      <defs>
        <clipPath id="plot-area">
          <rect x={m.l} y={m.t} width={w} height={h} />
        </clipPath>
      </defs>
      <rect x={m.l} y={m.t} width={w} height={h} fill="none" stroke="var(--line)" />
      {grid.map((f) => (
        <g key={f} stroke="var(--line)" strokeDasharray="2 4">
          <line x1={m.l + f * w} x2={m.l + f * w} y1={m.t} y2={m.t + h} />
          <line y1={m.t + f * h} y2={m.t + f * h} x1={m.l} x2={m.l + w} />
        </g>
      ))}
      <g clipPath="url(#plot-area)">
        {points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={dotR} fill={fillFor(p)} fillOpacity={revealed && kind === "outlier" && !p.hl ? 0.55 : 0.8} />
        ))}
        {overlays}
        {revealed && kind === "outlier" &&
          points.filter((p) => p.hl).map((p, i) => (
            <circle key={`hl${i}`} cx={sx(p.x)} cy={sy(p.y)} r={dotR + 8} fill="none" stroke="var(--bad)" strokeWidth="2.5" />
          ))}
      </g>
      {hasLabels && (
        <>
          <text x={m.l + w / 2} y={SIZE - 10} textAnchor="middle" fontSize="14" fill="var(--ink-2)">{labels.x}</text>
          <text x={14} y={m.t + h / 2} textAnchor="middle" fontSize="14" fill="var(--ink-2)" transform={`rotate(-90 14 ${m.t + h / 2})`}>{labels.y}</text>
        </>
      )}
    </svg>
  );
}

// Legend under the plot once revealed, naming what each overlay is.
export function PlotLegend({ round }) {
  const { kind, reveal } = round;
  const item = (color, text, dashed) => (
    <span key={text}>
      <i style={{ background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 10px)` : color }} />
      {text}
    </span>
  );
  if (kind === "simpson")
    return (
      <div className="legend">
        {reveal.groupR.map((_, g) => item(GROUP_COLORS[g], `Group ${String.fromCharCode(65 + g)}`))}
        {item("var(--ink-3)", "All points together", true)}
      </div>
    );
  if (kind === "outlier")
    return (
      <div className="legend">
        {item("var(--bad)", "Fit with the outlier", true)}
        {item("var(--good)", "Fit without it")}
      </div>
    );
  if (kind === "curve")
    return (
      <div className="legend">
        {reveal.curve && item("var(--good)", "Best-fit curve")}
        {item("var(--ink-3)", "Best straight line", true)}
      </div>
    );
  return <div className="legend">{item("var(--accent)", "Best straight line", kind !== "plain")}</div>;
}

// For spurious rounds: the two series over time, each scaled to its own
// range, so the shared drift is visible.
export function TimeSeries({ round }) {
  const { years, A, B } = round.reveal;
  const W = 480;
  const H = 150;
  const m = { l: 10, r: 10, t: 10, b: 22 };
  const sx = (i) => m.l + (i / (years.length - 1)) * (W - m.l - m.r);
  const line = (vals) => {
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    return vals
      .map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${(m.t + (1 - (v - lo) / (hi - lo || 1)) * (H - m.t - m.b)).toFixed(1)}`)
      .join(" ");
  };
  return (
    <div>
      <svg className="plot" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Both series over time">
        <path d={line(A)} fill="none" stroke="var(--g0)" strokeWidth="2.5" />
        <path d={line(B)} fill="none" stroke="var(--g1)" strokeWidth="2.5" />
        <text x={m.l} y={H - 6} fontSize="12" fill="var(--ink-3)">{years[0]}</text>
        <text x={W - m.r} y={H - 6} fontSize="12" fill="var(--ink-3)" textAnchor="end">{years[years.length - 1]}</text>
      </svg>
      <div className="legend">
        <span><i style={{ background: "var(--g0)" }} />{round.labels.x}</span>
        <span><i style={{ background: "var(--g1)" }} />{round.labels.y}</span>
      </div>
    </div>
  );
}
