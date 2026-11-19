"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadGames } from "@/lib/client/history";
import { KIND_LABELS } from "@/lib/correlation/rounds";

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

export default function StatsClient() {
  const [games, setGames] = useState(null);
  useEffect(() => setGames(loadGames()), []);
  if (games === null) return null;

  if (games.length === 0) {
    return (
      <div className="intro">
        <h1>My stats</h1>
        <p className="muted">No games on this device yet.</p>
        <div><Link className="btn btn-primary" href="/correlation">Play Guess the Correlation+</Link></div>
      </div>
    );
  }

  const best = Math.max(...games.map((g) => g.score));
  const recent = games.slice(0, 10);
  const avgRecent = recent.reduce((s, g) => s + g.avgError, 0) / recent.length;
  const kinds = byKind(games);
  const worst = kinds.length > 1 ? kinds[kinds.length - 1] : null;
  const maxErr = Math.max(0.3, ...kinds.map((k) => k.avgError));

  return (
    <div className="intro" style={{ maxWidth: 760 }}>
      <div>
        <div className="eyebrow">Guess the Correlation+</div>
        <h1 style={{ marginTop: 4 }}>My stats</h1>
        <p className="faint" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>Saved on this device only.</p>
      </div>
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
    </div>
  );
}
