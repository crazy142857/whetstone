"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SECURITY_GAMES, lessonsFor } from "@/lib/security/lessons";
import { lessonTotals } from "@/lib/client/history";

// Every lesson the AI security games teach, grouped by game. Lessons met
// in a game on this device show a badge with the average score.
export default function FieldGuide() {
  const [totals, setTotals] = useState({});
  useEffect(() => setTotals(lessonTotals(Object.keys(SECURITY_GAMES))), []);
  const all = Object.keys(SECURITY_GAMES).flatMap((g) => lessonsFor(g));
  const met = all.filter((l) => totals[l.id]).length;

  return (
    <div className="intro" style={{ maxWidth: 760 }}>
      <div>
        <div className="eyebrow">AI security</div>
        <h1 style={{ fontSize: "2rem", marginTop: 4 }}>Field guide</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          Every lesson from the AI security games in one place: what the risk looks like, and what to do about it.
          {met > 0 && ` You've met ${met} of ${all.length} on this device.`}
        </p>
      </div>
      {Object.entries(SECURITY_GAMES).map(([slug, game]) => (
        <section key={slug} className="guide-section">
          <div className="row">
            <h2>{game.name}</h2>
            <Link className="btn" href={game.href}>Play</Link>
          </div>
          {lessonsFor(slug).map((l) => {
            const t = totals[l.id];
            return (
              <article key={l.id} id={l.id} className="card lesson">
                <div className="row">
                  <h3>{l.title}</h3>
                  {t && <span className="pill">Met · {Math.round(t.points / t.rounds)} avg</span>}
                </div>
                <p>{l.summary}</p>
                <p className="defend"><strong>What to do:</strong> {l.defend}</p>
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
