"use client";

import { useState } from "react";
import DeckGame, { LessonCard, RoundResult } from "@/components/DeckGame";
import { CHOICES, CHOICE_LABELS } from "@/lib/gatekeeper/scenarios";
import { byId, dealGate, scoreGate } from "@/lib/gatekeeper/score";

function Action({ action }) {
  const { description, ...args } = action.args;
  return (
    <div className="action">
      {description && <div className="faint" style={{ marginBottom: 6 }}>Agent's description: "{description}"</div>}
      <pre className="action-call">
        <span className="tool">{action.tool}</span>
        {Object.entries(args).map(([k, v]) => `\n  ${k}: ${v}`).join("")}
      </pre>
    </div>
  );
}

function Round({ item, onScored, onNext, isLast }) {
  const [result, setResult] = useState(null);

  const choose = (choice) => {
    if (result) return;
    const res = scoreGate(item, choice);
    setResult(res);
    onScored(res);
  };

  return (
    <div className="game">
      <div className="card doc-card">
        <div className="eyebrow">The task it was given</div>
        <p className="task">{item.task}</p>
        <div className="eyebrow">What the agent has done so far</div>
        <ol className="trace">
          {item.trace.map((t, i) => (
            <li key={i}>
              {t.step}
              {t.note && <div className="trace-note">{t.note}</div>}
            </li>
          ))}
        </ol>
        <div className="eyebrow">Its next action</div>
        <Action action={item.action} />
      </div>
      <div className="panel">
        {!result ? (
          <div className="card panel">
            <div className="eyebrow">You're the gatekeeper</div>
            <p style={{ margin: 0 }}>Does this action run?</p>
            <div className="choices">
              {CHOICES.map((c) => (
                <button key={c} className={`btn choice choice-${c}`} onClick={() => choose(c)}>
                  {CHOICE_LABELS[c]}
                </button>
              ))}
            </div>
            <div className="hint">Allow: it runs. Ask me first: a person approves it. Block: it doesn't run.</div>
          </div>
        ) : (
          <>
            <RoundResult points={result.points} verdict={result.verdict} onNext={onNext} isLast={isLast} />
            <div className="card explain">
              <div className="result-row two">
                <div><div className="eyebrow">Best call</div><div className="big" data-testid="answer">{CHOICE_LABELS[item.answer]}</div></div>
                <div><div className="eyebrow">You</div><div className="big">{CHOICE_LABELS[result.choice]}</div></div>
              </div>
              <p style={{ marginTop: 12 }}>{item.why}</p>
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
      AI agents don't just answer, they act: read files, run commands, send email, pay. Someone has to decide which
      actions run on their own, which need a person's OK, and which never run. Today that's you.
    </p>
    <div className="card">
      <ul>
        <li>Each round: the task a colleague gave the agent, what it has done, and the exact action it wants to take next.</li>
        <li>Choose Allow, Ask me first, or Block.</li>
        <li>100 points for the right call. Being too careful gets partial credit; letting a risky action run gets none.</li>
        <li>Asking about everything isn't safe either: people stop reading prompts they see all day.</li>
      </ul>
    </div>
  </>
);

const getItem = (id) => byId[id];

export default function GatekeeperGame({ challengeSeed }) {
  return (
    <DeckGame
      slug="gatekeeper"
      title="Gatekeeper"
      skill="AI security"
      intro={intro}
      deal={dealGate}
      getItem={getItem}
      Round={Round}
      challengeSeed={challengeSeed}
    />
  );
}
