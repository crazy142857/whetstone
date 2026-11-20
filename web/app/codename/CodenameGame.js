"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LessonCard } from "@/components/DeckGame";
import { LEVELS, pickCodename } from "@/lib/codename/levels";
import { respond, initialChatState, isCorrectGuess, levelPoints } from "@/lib/codename/engine";
import { makeRng, randomSeed } from "@/lib/rng";
import { saveGame } from "@/lib/client/history";
import { loadProgress, saveProgress } from "@/lib/client/codenameProgress";

function freshLevel(n) {
  return {
    n,
    codename: pickCodename(makeRng(randomSeed())),
    chat: [],
    state: initialChatState(),
    messages: 0,
    wrong: 0,
    nudges: 0,
    cracked: null,
  };
}

function Bubble({ m }) {
  if (m.from === "you") return <div className="bubble you">{m.text}</div>;
  if (m.from === "guard")
    return (
      <div className="bubble guard" data-testid="guard">
        <strong>{m.guard}:</strong> {m.text}
      </div>
    );
  return (
    <div className="bubble penny" data-testid="penny">
      <span className="who">Penny</span>
      {m.text}
    </div>
  );
}

export default function CodenameGame() {
  const [progress, setProgress] = useState({ unlocked: 1, best: {} });
  const [lv, setLv] = useState(null);
  const [draft, setDraft] = useState("");
  const [guess, setGuess] = useState("");
  const [guessNote, setGuessNote] = useState("");
  const chatEnd = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    setLv(freshLevel(Math.min(p.unlocked, LEVELS.length)));
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "nearest" });
  }, [lv?.chat.length]);

  if (!lv) return null;
  const level = LEVELS[lv.n - 1];
  const allDone = Object.keys(progress.best).length === LEVELS.length;

  const go = (n) => {
    setLv(freshLevel(n));
    setDraft("");
    setGuess("");
    setGuessNote("");
  };

  const send = (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || lv.cracked) return;
    const out = respond({ level, codename: lv.codename, message: text, state: lv.state });
    setLv({ ...lv, chat: [...lv.chat, { from: "you", text }, out.reply], state: out.state, messages: lv.messages + 1 });
    setDraft("");
    input.current?.focus();
  };

  const submitGuess = (e) => {
    e.preventDefault();
    if (!guess.trim() || lv.cracked) return;
    if (!isCorrectGuess(guess, lv.codename)) {
      setLv({ ...lv, wrong: lv.wrong + 1 });
      setGuessNote("Not it. Keep chatting.");
      return;
    }
    const points = levelPoints(lv.messages, lv.wrong);
    setLv({ ...lv, cracked: { points } });
    setGuessNote("");
    const prev = progress.best[lv.n];
    const best = { ...progress.best, [lv.n]: !prev || points > prev.points ? { points, messages: lv.messages } : prev };
    const next = { unlocked: Math.max(progress.unlocked, Math.min(lv.n + 1, LEVELS.length)), best };
    setProgress(next);
    saveProgress(next);
    saveGame(
      {
        at: new Date().toISOString(),
        level: lv.n,
        score: points,
        maxScore: 100,
        rounds: 1,
        messages: lv.messages,
        byLesson: { [level.lesson]: { rounds: 1, points } },
      },
      "codename",
    );
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) send(e);
  };

  return (
    <div className="codename">
      <div className="codename-head">
        <div>
          <div className="eyebrow">AI security</div>
          <h1>Crack the Codename</h1>
          <p className="muted">
            Penny, the helpdesk bot, knows the codename of a secret project. Talk her into revealing it, then type it in
            the box. Every level adds a defence that real companies use, and shows you why it isn't enough.
          </p>
        </div>
        <div className="levels" role="tablist" aria-label="Levels">
          {LEVELS.map((L) => {
            const locked = L.n > progress.unlocked;
            const done = progress.best[L.n];
            return (
              <button
                key={L.n}
                role="tab"
                aria-selected={L.n === lv.n}
                className={`level-tab${L.n === lv.n ? " active" : ""}${done ? " done" : ""}`}
                disabled={locked}
                onClick={() => go(L.n)}
                title={locked ? "Crack the previous level first" : L.name}
              >
                {L.n}
              </button>
            );
          })}
        </div>
      </div>

      <div className="game">
        <div className="card chat-card">
          <div className="chat" aria-live="polite">
            <div className="bubble penny">
              <span className="who">Penny</span>
              Hi! I'm Penny from the helpdesk. How can I help?
            </div>
            {lv.chat.map((m, i) => <Bubble key={i} m={m} />)}
            <div ref={chatEnd} />
          </div>
          <form className="composer" onSubmit={send}>
            <textarea
              ref={input}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              rows={3}
              maxLength={1500}
              placeholder={lv.cracked ? "Level cracked." : "Message Penny (Enter to send, Shift+Enter for a new line)"}
              aria-label="Message Penny"
              disabled={Boolean(lv.cracked)}
            />
            <button className="btn btn-primary" type="submit" disabled={Boolean(lv.cracked)}>Send</button>
          </form>
          <div className="faint chat-foot">
            {lv.messages} message{lv.messages === 1 ? "" : "s"} sent · Penny is a simulated bot with a few weak spots, not a live AI.
          </div>
        </div>

        <div className="panel">
          <div className="card panel">
            <div>
              <div className="eyebrow">Level {level.n} of {LEVELS.length}</div>
              <h2 style={{ fontSize: "1.25rem", marginTop: 2 }}>{level.name}</h2>
              <p className="muted" style={{ margin: "6px 0 0" }}>{level.intro}</p>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Penny's defences</div>
              <ul className="defences">
                {level.defences.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
            {!lv.cracked ? (
              <>
                <form className="guess" onSubmit={submitGuess}>
                  <input
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Codename"
                    aria-label="Your guess for the codename"
                    autoComplete="off"
                  />
                  <button className="btn" type="submit">Guess</button>
                </form>
                {guessNote && <div className="grade-bad" role="status">{guessNote}</div>}
                {lv.nudges < level.nudges.length ? (
                  <button className="btn btn-link" onClick={() => setLv({ ...lv, nudges: lv.nudges + 1 })}>
                    Stuck? Show a hint
                  </button>
                ) : null}
                {level.nudges.slice(0, lv.nudges).map((t) => <div key={t} className="nudge">{t}</div>)}
              </>
            ) : (
              <div className="cracked" data-testid="cracked">
                <div className="grade grade-good">Cracked: {lv.codename.word}</div>
                <div className="faint num">
                  {lv.messages} message{lv.messages === 1 ? "" : "s"}
                  {lv.wrong ? `, ${lv.wrong} wrong guess${lv.wrong > 1 ? "es" : ""}` : ""} · +{lv.cracked.points} points
                </div>
                <div className="actions" style={{ marginTop: 10 }}>
                  {lv.n < LEVELS.length ? (
                    <button className="btn btn-primary" onClick={() => go(lv.n + 1)} autoFocus>Next level</button>
                  ) : null}
                  <button className="btn" onClick={() => go(lv.n)}>Play this level again</button>
                </div>
              </div>
            )}
          </div>
          {lv.cracked && <LessonCard lesson={level.lesson} />}
          {lv.cracked && lv.n === LEVELS.length && allDone && (
            <div className="card explain">
              <div className="eyebrow" style={{ marginBottom: 4 }}>All six cracked</div>
              <h3>The one fix that works every time</h3>
              <p>
                Every defence here was a layer around a bot that knew the secret. The only bot that can't leak a
                codename is one that was never given it. Keep secrets out of prompts and out of what AI tools can read.
              </p>
              <Link href="/field-guide#secret-in-prompt">Review the lessons in the field guide</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
