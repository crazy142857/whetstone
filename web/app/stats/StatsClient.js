"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadGames } from "@/lib/client/history";
import { KIND_LABELS } from "@/lib/correlation/rounds";
import { LESSONS, SECURITY_GAMES } from "@/lib/security/lessons";

// Average miss per round type across every saved game, weighted by rounds.
function byKind(games) {
  const acc = {};
  for (const g of games) {
    for (const [kind, k] of Object.entries(g.byKind || {})) {
      const a = (acc[kind] ||= { rounds: 0, totalError: 0, misses: 0 });
      a.rounds += k.rounds;
      a.totalError += k.totalError;
      a.misses += k.misses;
    }
  }
  return Object.entries(acc)
    .map(([kind, a]) => ({ kind, ...a, avgError: a.totalError / a.rounds }))
    .sort((x, y) => x.avgError - y.avgError);
}

// One AI security game's history: best, games, and lessons weakest first.
function SecurityStats({ slug, games }) {
  const best = Math.max(...games.map((g) => g.score));
  const recent = games.slice(0, 10);
  const lessons = {};
  for (const g of games) {
    for (const [id, l] of Object.entries(g.byLesson || {})) {
      const a = (lessons[id] ||= { rounds: 0, points: 0 });
      a.rounds += l.rounds;
      a.points += l.points;
    }
  }
  const rows = Object.entries(lessons)
    .filter(([id]) => LESSONS[id])
    .map(([id, l]) => ({ id, ...l, avg: l.points / l.rounds }))
    .sort((a, b) => a.avg - b.avg);
  return (
    <div className="card">
      <div className="row">
        <h3>{SECURITY_GAMES[slug].name}</h3>
        <Link className="faint" href={SECURITY_GAMES[slug].href}>Play</Link>
      </div>
      <p className="muted" style={{ margin: "4px 0 10px" }}>
        Best <strong className="num">{best}</strong> of {games[0].maxScore} · {games.length} game{games.length > 1 ? "s" : ""} ·
        last 10 average <span className="num">{Math.round(recent.reduce((s, g) => s + g.score, 0) / recent.length)}</span>
      </p>
      <table className="table">
        <thead><tr><th>Lesson</th><th>Rounds</th><th style={{ width: "40%" }}>Average points</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/field-guide#${r.id}`}>{LESSONS[r.id].title}</Link></td>
              <td className="num">{r.rounds}</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="bar" style={{ flex: 1 }}><span style={{ width: `${r.avg}%` }} /></div>
                  <span className="num">{Math.round(r.avg)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Crack the Codename: best result per level cracked.
function CodenameStats({ games }) {
  const best = {};
  for (const g of games) {
    if (!g.level) continue;
    if (!best[g.level] || g.score > best[g.level].score) best[g.level] = g;
  }
  const levels = Object.keys(best).map(Number).sort((a, b) => a - b);
  return (
    <div className="card">
      <div className="row">
        <h3>{SECURITY_GAMES.codename.name}</h3>
        <Link className="faint" href={SECURITY_GAMES.codename.href}>Play</Link>
      </div>
      <p className="muted" style={{ margin: "4px 0 10px" }}>{levels.length} of 6 levels cracked.</p>
      <table className="table">
        <thead><tr><th>Level</th><th>Fewest messages</th><th>Best points</th></tr></thead>
        <tbody>
          {levels.map((n) => (
            <tr key={n}>
              <td>{n}</td>
              <td className="num">{best[n].messages}</td>
              <td className="num">{best[n].score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StatsClient() {
  const [all, setAll] = useState(null);
  useEffect(() => {
    const out = { correlation: loadGames() };
    for (const slug of Object.keys(SECURITY_GAMES)) out[slug] = loadGames(slug);
    setAll(out);
  }, []);
  if (all === null) return null;

  const security = Object.keys(SECURITY_GAMES).filter((slug) => slug !== "codename" && all[slug].length > 0);
  const codename = all.codename || [];
  if (all.correlation.length === 0 && security.length === 0 && codename.length === 0) {
    return (
      <div className="intro">
        <h1>My stats</h1>
        <p className="muted">No games on this device yet.</p>
        <div className="actions">
          <Link className="btn btn-primary" href="/injection">Play Spot the Injection</Link>
          <Link className="btn" href="/correlation">Play Guess the Correlation+</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="intro" style={{ maxWidth: 760 }}>
      <div>
        <h1>My stats</h1>
        <p className="faint" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>Saved on this device only.</p>
      </div>
      {(security.length > 0 || codename.length > 0) && (
        <>
          <h2 style={{ fontSize: "1.2rem", marginTop: 8 }}>AI security</h2>
          {security.map((slug) => <SecurityStats key={slug} slug={slug} games={all[slug]} />)}
          {codename.length > 0 && <CodenameStats games={codename} />}
        </>
      )}
      {all.correlation.length > 0 && <CorrelationStats games={all.correlation} />}
    </div>
  );
}

function CorrelationStats({ games }) {

  const best = Math.max(...games.map((g) => g.score));
  const recent = games.slice(0, 10);
  const avgRecent = recent.reduce((s, g) => s + g.avgError, 0) / recent.length;
  const kinds = byKind(games);
  const worst = kinds.length > 1 ? kinds[kinds.length - 1] : null;
  const maxErr = Math.max(0.3, ...kinds.map((k) => k.avgError));

  return (
    <>
      <h2 style={{ fontSize: "1.2rem", marginTop: 8 }}>Guess the Correlation+</h2>
      <div className="stats-grid">
        <div className="card stat"><div className="eyebrow">Best score</div><div className="big num">{best}</div></div>
        <div className="card stat"><div className="eyebrow">Games</div><div className="big num">{games.length}</div></div>
        <div className="card stat"><div className="eyebrow">Avg miss, last 10</div><div className="big num">{avgRecent.toFixed(2)}</div></div>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 4 }}>By round type</h3>
        {worst && (
          <p className="muted" style={{ marginTop: 0 }}>
            Your weakest spot so far: <strong>{KIND_LABELS[worst.kind]}</strong>.
          </p>
        )}
        <table className="table">
          <thead><tr><th>Round type</th><th>Rounds</th><th style={{ width: "40%" }}>Average miss</th></tr></thead>
          <tbody>
            {kinds.map((k) => (
              <tr key={k.kind}>
                <td>{KIND_LABELS[k.kind]}</td>
                <td className="num">{k.rounds}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="bar" style={{ flex: 1 }}><span style={{ width: `${(k.avgError / maxErr) * 100}%` }} /></div>
                    <span className="num">{k.avgError.toFixed(2)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Recent games</h3>
        <table className="table">
          <thead><tr><th>When</th><th>Score</th><th>Rounds</th><th>Avg miss</th></tr></thead>
          <tbody>
            {recent.map((g) => (
              <tr key={g.at}>
                <td>{new Date(g.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="num">{g.score}</td>
                <td className="num">{g.rounds}</td>
                <td className="num">{g.avgError.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
