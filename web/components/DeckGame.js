"use client";

// The shell shared by the AI security games: intro, a fixed deck of rounds
// dealt from a seed, a running score, and a game-over screen with the
// lessons met and a "Challenge the team" link. Each game supplies its own
// Round component, which handles the answer and the reveal:
//   <Round item index onScored={(result) => ...} onNext isLast />
// onScored({ points, verdict }) is called once, when the player commits.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { randomSeed } from "@/lib/rng";
import { summarizeDeck } from "@/lib/security/deck";
import { LESSONS } from "@/lib/security/lessons";
import { saveGame, loadGames, bestScore } from "@/lib/client/history";

export function LessonCard({ lesson }) {
  const l = LESSONS[lesson];
  if (!l) return null;
  return (
    <div className="card lesson">
      <div className="eyebrow">Field guide</div>
      <h3>{l.title}</h3>
      <p>{l.summary}</p>
      <p className="defend"><strong>What to do:</strong> {l.defend}</p>
      <Link className="faint" href={`/field-guide#${lesson}`}>All lessons in the field guide</Link>
    </div>
  );
}

// The score line and Next button at the top of every reveal.
export function RoundResult({ points, verdict, onNext, isLast }) {
  const next = useRef(null);
  useEffect(() => next.current?.focus(), []);
  const tone = points === 100 ? "good" : points >= 50 ? "warn" : "bad";
  return (
    <div className="card round-result">
      <div>
        <div className={`grade grade-${tone}`} data-testid="verdict">{verdict}</div>
        <div className="faint num">+{points} points</div>
      </div>
      <button ref={next} className="btn btn-primary" onClick={onNext}>
        {isLast ? "See results" : "Next round"}
      </button>
    </div>
  );
}

function Intro({ title, skill, children, onStart, challengeSeed, best }) {
  return (
    <div className="intro">
      <div>
        <div className="eyebrow">{skill}</div>
        <h1 style={{ fontSize: "2rem", marginTop: 4 }}>{title}</h1>
      </div>
      {children}
      {challengeSeed && (
        <p className="muted" style={{ margin: 0 }}>
          This is a challenge link: you get the same rounds as whoever sent it, in the same order.
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

function GameOver({ slug, seed, results, onAgain, isBest }) {
  const sum = summarizeDeck(results);
  const [copied, setCopied] = useState(false);
  const lessons = Object.entries(sum.byLesson)
    .map(([id, l]) => ({ id, ...l, avg: l.points / l.rounds }))
    .sort((a, b) => a.avg - b.avg);

  const copyLink = async () => {
    const url = `${window.location.origin}/${slug}?seed=${seed}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <div className="intro" style={{ maxWidth: 760 }}>
      <div>
        <div className="eyebrow">Game over</div>
        <h1 style={{ fontSize: "2.4rem", marginTop: 4 }} className="num">
          {sum.score} <span className="faint" style={{ fontSize: "1.2rem" }}>/ {sum.maxScore}</span>
        </h1>
        {isBest && <span className="pill pill-accent">New personal best</span>}
      </div>
      <div className="stats-grid">
        <div className="card stat"><div className="eyebrow">Rounds</div><div className="big num">{sum.rounds}</div></div>
        <div className="card stat"><div className="eyebrow">Perfect rounds</div><div className="big num">{sum.perfect}</div></div>
        <div className="card stat"><div className="eyebrow">Average</div><div className="big num">{Math.round(sum.score / sum.rounds)}</div></div>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 4 }}>Your takeaways</h3>
        <p className="muted" style={{ marginTop: 0 }}>The lessons in this game, weakest first.</p>
        <ul className="takeaways">
          {lessons.map((l) => (
            <li key={l.id}>
              <div className="row">
                <strong>{LESSONS[l.id].title}</strong>
                <span className="faint num">{Math.round(l.avg)} avg · {l.rounds} round{l.rounds > 1 ? "s" : ""}</span>
              </div>
              <div className="muted">{LESSONS[l.id].defend}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="actions">
        <button className="btn btn-primary" onClick={onAgain} autoFocus>Play again</button>
        <button className="btn" onClick={copyLink}>{copied ? "Link copied" : "Challenge the team"}</button>
        <Link className="btn" href="/field-guide">Field guide</Link>
      </div>
      <p className="faint" style={{ margin: 0, fontSize: "0.85rem" }}>
        "Challenge the team" copies a link to this exact game: same rounds, same order.
      </p>
    </div>
  );
}

export default function DeckGame({ slug, title, skill, intro, deal, getItem, Round, challengeSeed }) {
  const [phase, setPhase] = useState("intro");
  const [seed, setSeed] = useState(challengeSeed);
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [best, setBest] = useState(0);
  const [isBest, setIsBest] = useState(false);

  useEffect(() => setBest(bestScore(loadGames(slug))), [slug]);

  const begin = useCallback(
    (s) => {
      setSeed(s);
      setDeck(deal(s));
      setIndex(0);
      setResults([]);
      setPhase("play");
    },
    [deal],
  );

  const start = () => begin(challengeSeed || randomSeed());
  const again = () => {
    if (challengeSeed) window.history.replaceState(null, "", `/${slug}`);
    begin(randomSeed());
  };

  const item = phase === "play" ? getItem(deck[index]) : null;

  const onScored = (res) => {
    const all = [...results, { id: item.id, lesson: item.lesson, points: res.points }];
    setResults(all);
    if (all.length === deck.length) {
      const sum = summarizeDeck(all);
      const prevBest = bestScore(loadGames(slug));
      setIsBest(sum.score > 0 && sum.score > prevBest);
      saveGame(
        { at: new Date().toISOString(), seed, score: sum.score, rounds: sum.rounds, maxScore: sum.maxScore, perfect: sum.perfect, byLesson: sum.byLesson },
        slug,
      );
    }
  };

  const onNext = () => {
    if (index + 1 >= deck.length) {
      setPhase("over");
      setBest(bestScore(loadGames(slug)));
      window.scrollTo(0, 0);
      return;
    }
    setIndex(index + 1);
    window.scrollTo(0, 0);
  };

  if (phase === "intro")
    return (
      <Intro title={title} skill={skill} onStart={start} challengeSeed={challengeSeed} best={best}>
        {intro}
      </Intro>
    );
  if (phase === "over") return <GameOver slug={slug} seed={seed} results={results} onAgain={again} isBest={isBest} />;

  const score = results.reduce((s, r) => s + r.points, 0);
  return (
    <div>
      <div className="hud">
        <span className="score num" data-testid="score">{score}</span>
        <span className="faint">Round {index + 1} of {deck.length}</span>
        <div className="bar" style={{ flex: "1 1 120px", maxWidth: 220 }}>
          <span style={{ width: `${(results.length / deck.length) * 100}%` }} />
        </div>
      </div>
      <Round key={`${seed}:${index}`} item={item} index={index} onScored={onScored} onNext={onNext} isLast={index + 1 >= deck.length} />
    </div>
  );
}
