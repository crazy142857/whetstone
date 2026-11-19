"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ScatterPlot, { PlotLegend, TimeSeries } from "@/components/ScatterPlot";
import { makeRound, KIND_LABELS } from "@/lib/correlation/rounds";
import { scoreGuess, initialState, summarize, GRADE_LABELS, START_LIVES } from "@/lib/correlation/scoring";
import { explainRound, fmt } from "@/lib/correlation/explain";
import { randomSeed } from "@/lib/correlation/rng";
import { saveGame, loadGames, bestScore } from "@/lib/client/history";

const clamp = (v) => Math.max(-1, Math.min(1, Math.round(v * 100) / 100));

function Lives({ lives }) {
  return (
    <span className="lives" aria-label={`${lives} of ${START_LIVES} lives left`}>
      {Array.from({ length: START_LIVES }, (_, i) => (
        <span key={i} className={`life${i < lives ? "" : " lost"}`} />
      ))}
    </span>
  );
}

function Intro({ onStart, challengeSeed, best }) {
  return (
    <div className="intro">
      <div>
        <div className="eyebrow">Reading data</div>
        <h1 style={{ fontSize: "2rem", marginTop: 4 }}>Guess the Correlation+</h1>
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Each round shows a scatter plot. Call Pearson's r, from −1 to 1. After a few warm-up rounds the traps start:
        plots built to fool your eye, or the number itself.
      </p>
      <div className="card">
        <ul>
          <li>Up to 100 points a round: full marks for a perfect guess, nothing at 0.40 off.</li>
          <li>Within 0.10 builds a streak. Each step adds 10% to the round's points, up to double.</li>
          <li>More than 0.25 off costs a life. Within 0.05 wins one back. Three lives.</li>
          <li>After each round: what just happened, and why.</li>
        </ul>
      </div>
      {challengeSeed && (
        <p className="muted" style={{ margin: 0 }}>
          This is a challenge link: you get the same plots as whoever sent it, in the same order.
        </p>
      )}
      <div className="actions">
        <button className="btn btn-primary" onClick={onStart} autoFocus>
          {challengeSeed ? "Play the challenge" : "Start"}
        </button>
        {best > 0 && <span className="faint" style={{ alignSelf: "center" }}>Your best: {best}</span>}
      </div>
    </div>
  );
}

function GameOver({ seed, state, results, onAgain }) {
  const sum = summarize(results);
  const [copied, setCopied] = useState(false);
  const games = loadGames();
  const best = bestScore(games);
  const isBest = state.score >= best && state.score > 0;
  const kinds = Object.entries(sum.byKind);

  const copyLink = async () => {
    const url = `${window.location.origin}/correlation?seed=${seed}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <div className="intro">
      <div>
        <div className="eyebrow">Game over</div>
        <h1 style={{ fontSize: "2.4rem", marginTop: 4 }} className="num">
          {state.score} points
        </h1>
        {isBest && <span className="pill pill-accent">New personal best</span>}
      </div>
      <div className="stats-grid">
        <div className="card stat"><div className="eyebrow">Rounds</div><div className="big num">{sum.rounds}</div></div>
        <div className="card stat"><div className="eyebrow">Average miss</div><div className="big num">{sum.avgError.toFixed(2)}</div></div>
        <div className="card stat"><div className="eyebrow">Bullseyes</div><div className="big num">{sum.bullseyes}</div></div>
        <div className="card stat"><div className="eyebrow">Best streak</div><div className="big num">{state.bestStreak}</div></div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Round type</th><th>Rounds</th><th>Average miss</th><th>Lives lost</th></tr>
          </thead>
          <tbody>
            {kinds.map(([kind, k]) => (
              <tr key={kind}>
                <td>{KIND_LABELS[kind]}</td>
                <td className="num">{k.rounds}</td>
                <td className="num">{k.avgError.toFixed(2)}</td>
                <td className="num">{k.misses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="actions">
        <button className="btn btn-primary" onClick={onAgain} autoFocus>Play again</button>
        <button className="btn" onClick={copyLink}>{copied ? "Link copied" : "Challenge the team"}</button>
        <Link className="btn" href="/stats">My stats</Link>
      </div>
      <p className="faint" style={{ margin: 0, fontSize: "0.85rem" }}>
        "Challenge the team" copies a link to this exact game, same plots in the same order.
      </p>
    </div>
  );
}

export default function CorrelationGame({ challengeSeed }) {
  const [phase, setPhase] = useState("intro");
  const [seed, setSeed] = useState(challengeSeed);
  const [round, setRound] = useState(null);
  const [guess, setGuess] = useState(0);
  const [state, setState] = useState(initialState);
  const [results, setResults] = useState([]);
  const [last, setLast] = useState(null);
  const [best, setBest] = useState(0);
  const slider = useRef(null);
  const nextBtn = useRef(null);

  useEffect(() => setBest(bestScore()), []);

  const begin = useCallback(
    (s) => {
      setSeed(s);
      setState(initialState());
      setResults([]);
      setLast(null);
      setGuess(0);
      setRound(makeRound(s, 1));
      setPhase("guess");
    },
    [],
  );

  const start = () => begin(challengeSeed || randomSeed());
  const again = () => {
    if (challengeSeed) window.history.replaceState(null, "", "/correlation");
    begin(randomSeed());
  };

  const lockIn = useCallback(() => {
    if (phase !== "guess" || !round) return;
    const g = clamp(guess);
    const out = scoreGuess(state, g, round.r);
    const res = { ...out.result, kind: round.kind, index: round.index };
    const all = [...results, res];
    setState(out.state);
    setResults(all);
    setLast(res);
    setPhase("reveal");
    if (out.state.lives <= 0) {
      const sum = summarize(all);
      saveGame({
        at: new Date().toISOString(),
        seed,
        score: out.state.score,
        rounds: sum.rounds,
        avgError: sum.avgError,
        bullseyes: sum.bullseyes,
        bestStreak: out.state.bestStreak,
        byKind: sum.byKind,
      });
    }
  }, [phase, round, guess, state, results, seed]);

  const next = useCallback(() => {
    if (state.lives <= 0) {
      setPhase("over");
      return;
    }
    setRound(makeRound(seed, round.index + 1));
    setGuess(0);
    setPhase("guess");
  }, [state.lives, seed, round]);

  useEffect(() => {
    if (phase === "guess") slider.current?.focus();
    if (phase === "reveal") nextBtn.current?.focus();
  }, [phase, round]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Enter" || e.target?.tagName === "BUTTON") return;
      if (phase === "guess") {
        e.preventDefault();
        lockIn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, lockIn]);

  if (phase === "intro") return <Intro onStart={start} challengeSeed={challengeSeed} best={best} />;
  if (phase === "over") return <GameOver seed={seed} state={state} results={results} onAgain={again} />;

  const revealed = phase === "reveal";
  const ex = revealed ? explainRound(round, last.guess) : null;

  return (
    <div>
      <div className="hud">
        <span className="score num" data-testid="score">{state.score}</span>
        <span className="faint">Round {round.index}</span>
        <Lives lives={state.lives} />
        {state.streak > 1 && <span className="pill pill-accent">Streak {state.streak}</span>}
      </div>
      <div className="game">
        <div className="plot-wrap">
          <ScatterPlot round={round} revealed={revealed} />
          {revealed && <PlotLegend round={round} />}
        </div>
        <div className="panel">
          {!revealed ? (
            <div className="card panel">
              <div className="eyebrow">Your guess for r</div>
              <div className="guess-value num" aria-live="polite">{fmt(guess)}</div>
              <div>
                <input
                  ref={slider}
                  className="slider"
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={guess}
                  onChange={(e) => setGuess(clamp(Number(e.target.value)))}
                  aria-label="Guess for r"
                />
                <div className="scale"><span>−1</span><span>0</span><span>1</span></div>
              </div>
              <div className="nudges">
                <button className="btn" onClick={() => setGuess((g) => clamp(g - 0.1))}>−0.1</button>
                <button className="btn" onClick={() => setGuess((g) => clamp(g - 0.01))}>−0.01</button>
                <button className="btn" onClick={() => setGuess((g) => clamp(g + 0.01))}>+0.01</button>
                <button className="btn" onClick={() => setGuess((g) => clamp(g + 0.1))}>+0.1</button>
              </div>
              <button className="btn btn-primary" onClick={lockIn}>Lock in</button>
              <div className="hint">Arrow keys move the slider. Enter locks in.</div>
            </div>
          ) : (
            <>
              <div className="card panel">
                {round.kind !== "plain" && <div className="kind-tag">{KIND_LABELS[round.kind]}</div>}
                <div className="result-row">
                  <div><div className="eyebrow">Actual r</div><div className="big num" data-testid="actual">{fmt(round.r)}</div></div>
                  <div><div className="eyebrow">You</div><div className="big num">{fmt(last.guess)}</div></div>
                  <div><div className="eyebrow">Points</div><div className="big num">+{last.points}</div></div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span className={`grade grade-${last.grade}`}>{GRADE_LABELS[last.grade]}</span>
                  <span className="faint">
                    {" "}· off by {last.error.toFixed(2)}
                    {last.multiplier > 1 ? ` · streak ×${last.multiplier.toFixed(1)}` : ""}
                    {last.lifeLost ? " · life lost" : ""}
                    {last.lifeWon ? " · life won back" : ""}
                  </span>
                </div>
                <button ref={nextBtn} className="btn btn-primary" onClick={next}>
                  {state.lives <= 0 ? "See results" : "Next round"}
                </button>
              </div>
              <div className="card explain">
                <div className="eyebrow" style={{ marginBottom: 4 }}>What just happened</div>
                <h3>{ex.title}</h3>
                {ex.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                {round.kind === "spurious" && <TimeSeries round={round} />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
