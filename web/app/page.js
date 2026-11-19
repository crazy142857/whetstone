import Link from "next/link";
import { GAMES } from "@/lib/games";
import BestScore from "@/components/BestScore";

export default function Hub() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">For the data team</div>
        <h1>Keep your instincts sharp.</h1>
        <p className="muted">
          Short games for the skills a data team uses every day. Play a round over coffee, learn something
          from every miss, and see who on the team reads a chart best.
        </p>
      </section>
      <section className="games">
        {GAMES.map((g) =>
          g.status === "live" ? (
            <div key={g.slug} className="card game-card">
              <div className="row">
                <span className="pill">{g.skill}</span>
                <BestScore />
              </div>
              <h2>{g.name}</h2>
              <p className="muted">{g.blurb}</p>
              <div>
                <Link href={g.href} className="btn btn-primary">Play</Link>
              </div>
            </div>
          ) : (
            <div key={g.slug} className="card game-card soon">
              <div className="row">
                <span className="pill">{g.skill}</span>
                <span className="faint" style={{ fontSize: "0.8rem" }}>Coming later</span>
              </div>
              <h2>{g.name}</h2>
              <p className="muted">{g.blurb}</p>
            </div>
          ),
        )}
      </section>
    </>
  );
}
