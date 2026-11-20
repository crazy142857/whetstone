import Link from "next/link";
import { SECTIONS } from "@/lib/games";
import BestScore from "@/components/BestScore";

function GameCard({ g }) {
  if (g.status !== "live") {
    return (
      <div className="card game-card soon">
        <div className="row">
          <span className="pill">{g.skill}</span>
          <span className="faint" style={{ fontSize: "0.8rem" }}>Coming later</span>
        </div>
        <h2>{g.name}</h2>
        <p className="muted">{g.blurb}</p>
      </div>
    );
  }
  return (
    <div className="card game-card">
      <div className="row">
        <span className="pill">{g.skill}</span>
        <BestScore game={g.slug} />
      </div>
      <h2>{g.name}</h2>
      <p className="muted">{g.blurb}</p>
      <div>
        <Link href={g.href} className="btn btn-primary">Play</Link>
      </div>
    </div>
  );
}

export default function Hub() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">Training you'll actually play</div>
        <h1>Keep your instincts sharp.</h1>
        <p className="muted">
          Short games for the skills work needs now: reading data honestly and using AI safely. Play a round over
          coffee, learn something from every miss, and challenge the team to beat your score.
        </p>
      </section>
      {SECTIONS.map((s) => (
        <section key={s.title} className="hub-section">
          <div className="section-head">
            <h2>{s.title}</h2>
            {s.blurb && <p className="muted">{s.blurb}</p>}
          </div>
          <div className="games">
            {s.games.map((g) => <GameCard key={g.slug} g={g} />)}
          </div>
        </section>
      ))}
    </>
  );
}
