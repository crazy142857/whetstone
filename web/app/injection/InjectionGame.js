"use client";

import { useState } from "react";
import DeckGame, { LessonCard, RoundResult } from "@/components/DeckGame";
import { byId, dealInjection, scoreInjection } from "@/lib/injection/score";

function Round({ item, onScored, onNext, isLast }) {
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
    const res = scoreInjection(item, [...flagged]);
    setResult(res);
    onScored(res);
  };

  const lineClass = (line, i) => {
    if (!result) return flagged.has(i) ? "doc-line flagged" : "doc-line";
    if (line.inj) return flagged.has(i) ? "doc-line hit" : "doc-line missed";
    return flagged.has(i) ? "doc-line false-flag" : "doc-line";
  };

  return (
    <div className="game">
      <div className="card doc-card">
        <div className="doc-head">
          <span className="pill">{item.source}</span>
          <p className="muted">{item.context}</p>
        </div>
        <div className="doc" role="group" aria-label="Content the AI will read">
          {item.lines.map((line, i) => (
            <div key={i}>
              <button
                type="button"
                className={lineClass(line, i)}
                aria-pressed={flagged.has(i)}
                onClick={() => toggle(i)}
                disabled={Boolean(result)}
                data-testid={`line-${i}`}
              >
                {line.t}
              </button>
              {result && line.inj && <div className="line-note">{line.why}</div>}
              {result && !line.inj && flagged.has(i) && <div className="line-note warn">Not an injection: ordinary content.</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        {!result ? (
          <div className="card panel">
            <div className="eyebrow">Your call</div>
            <p style={{ margin: 0 }}>
              Tap every line that tries to hijack the AI. If nothing does, say it looks clean.
            </p>
            <button className="btn btn-primary" onClick={check}>
              {flagged.size === 0 ? "Looks clean" : `Flag ${flagged.size} line${flagged.size > 1 ? "s" : ""}`}
            </button>
            <div className="hint">Wrongly flagged lines cost points too.</div>
          </div>
        ) : (
          <>
            <RoundResult points={result.points} verdict={result.verdict} onNext={onNext} isLast={isLast} />
            <div className="card explain">
              <div className="eyebrow" style={{ marginBottom: 4 }}>What just happened</div>
              {item.seenAs && <p><strong>What a person saw:</strong> {item.seenAs}</p>}
              <p>{item.takeaway}</p>
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
      AI assistants read emails, web pages, documents and chats on your behalf. Prompt injection is text hidden in
      that content that tries to give the AI new orders: leak data, use its tools, or tilt its answer.
    </p>
    <div className="card">
      <ul>
        <li>Each round: something an AI is about to read at work, and what it was asked to do.</li>
        <li>Tap the lines that try to hijack it. Some rounds are clean: instructions meant for people aren't attacks.</li>
        <li>100 points a round. Missing an injection or flagging an innocent line costs points.</li>
        <li>Eight rounds, each followed by what to look for next time.</li>
      </ul>
    </div>
  </>
);

const getItem = (id) => byId[id];

export default function InjectionGame({ challengeSeed }) {
  return (
    <DeckGame
      slug="injection"
      title="Spot the Injection"
      skill="AI security"
      intro={intro}
      deal={dealInjection}
      getItem={getItem}
      Round={Round}
      challengeSeed={challengeSeed}
    />
  );
}
