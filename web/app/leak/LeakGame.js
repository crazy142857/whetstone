"use client";

import { useMemo, useState } from "react";
import DeckGame, { LessonCard, RoundResult } from "@/components/DeckGame";
import { LESSONS } from "@/lib/security/lessons";
import { byId, dealLeak, parsePrompt, saferText, scoreLeak, tokenize } from "@/lib/leak/score";

function Round({ item, onScored, onNext, isLast }) {
  const tokens = useMemo(() => tokenize(item.text), [item]);
  const [flagged, setFlagged] = useState(() => new Set());
  const [result, setResult] = useState(null);

  const toggle = (i) => {
    if (result) return;
    const next = new Set(flagged);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setFlagged(next);
  };

  const check = () => {
    const res = scoreLeak(item, [...flagged]);
    setResult(res);
    onScored(res);
  };

  const tokClass = (t) => {
    const on = flagged.has(t.i);
    if (!result) return on ? "tok flagged" : "tok";
    if (t.span) {
      const kind = item.spans[t.span].kind;
      if (kind === "safe") return result.safeFlagged.includes(t.span) ? "tok false-flag" : "tok safe";
      return result.found.includes(t.span) ? "tok hit" : "tok missed";
    }
    return on ? "tok false-flag" : "tok";
  };

  // Notes in the order the spans appear in the prompt.
  const spanOrder = parsePrompt(item.text).filter((s) => s.span).map((s) => ({ n: s.span, text: s.text }));

  return (
    <div className="game">
      <div className="card doc-card">
        <div className="doc-head">
          <span className="pill">{item.title}</span>
          <p className="muted">A colleague is about to paste this into a free public AI chatbot.</p>
        </div>
        <div className={`prompt${item.code ? " code" : ""}`} role="group" aria-label="Prompt about to be sent">
          {tokens.map((t) =>
            t.word ? (
              <button
                key={t.i}
                type="button"
                className={tokClass(t)}
                aria-pressed={flagged.has(t.i)}
                onClick={() => toggle(t.i)}
                disabled={Boolean(result)}
                data-span={t.span ?? undefined}
              >
                {t.text}
              </button>
            ) : (
              <span key={t.i}>{t.text}</span>
            ),
          )}
        </div>
        {result && (
          <div className="legend">
            <span><i className="sw hit" />Caught</span>
            <span><i className="sw missed" />Slipped through</span>
            <span><i className="sw false-flag" />Flagged, but fine</span>
            <span><i className="sw safe" />Looked risky, but fine</span>
          </div>
        )}
      </div>
      <div className="panel">
        {!result ? (
          <div className="card panel">
            <div className="eyebrow">Your call</div>
            <p style={{ margin: 0 }}>
              Tap anything that shouldn't leave the company: one word of it is enough. Leave what the AI actually needs.
            </p>
            <button className="btn btn-primary" onClick={check}>
              {flagged.size === 0 ? "Nothing to remove" : "Check"}
            </button>
            <div className="hint">Flagging harmless text costs points: an over-redacted prompt is useless.</div>
          </div>
        ) : (
          <>
            <RoundResult points={result.points} verdict={result.verdict} onNext={onNext} isLast={isLast} />
            <div className="card explain">
              <div className="eyebrow" style={{ marginBottom: 6 }}>The safer prompt</div>
              <pre className="safer">{saferText(item)}</pre>
            </div>
            <div className="card explain">
              <div className="eyebrow" style={{ marginBottom: 6 }}>Line by line</div>
              <ul className="span-notes">
                {spanOrder.map(({ n, text }) => {
                  const sp = item.spans[n];
                  const status =
                    sp.kind === "safe"
                      ? result.safeFlagged.includes(n) ? "false-flag" : "safe"
                      : result.found.includes(n) ? "hit" : "missed";
                  return (
                    <li key={n} className={status}>
                      <div className="span-text">{text}</div>
                      <div><strong>{LESSONS[sp.kind].title}.</strong> {sp.note}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <LessonCard lesson={item.lesson} />
          </>
        )}
      </div>
    </div>
  );
}

const intro = (
  <>
    <p className="muted" style={{ margin: 0 }}>
      Pasting work into a public AI chatbot sends it to another company. Most of the time that's fine, as long as
      what you paste doesn't include secrets, personal data or confidential business information.
    </p>
    <div className="card">
      <ul>
        <li>Each round: a prompt someone is about to send, from a real kind of work task.</li>
        <li>Tap every word that shouldn't leave the company. One word of a phrase flags the whole phrase.</li>
        <li>Points for each leak caught; flagging harmless text costs points, because an AI can't help with a prompt that's all blanks.</li>
        <li>After each round: the safer version of the prompt, and why each part was or wasn't a problem.</li>
      </ul>
    </div>
  </>
);

const getItem = (id) => byId[id];

export default function LeakGame({ challengeSeed }) {
  return (
    <DeckGame
      slug="leak"
      title="Leak Check"
      skill="AI security"
      intro={intro}
      deal={dealLeak}
      getItem={getItem}
      Round={Round}
      challengeSeed={challengeSeed}
    />
  );
}
