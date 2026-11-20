"use client";

import { useEffect, useState } from "react";
import { bestScore, loadGames } from "@/lib/client/history";

export default function BestScore({ game = "correlation" }) {
  const [best, setBest] = useState(0);
  useEffect(() => setBest(bestScore(loadGames(game))), [game]);
  if (!best) return null;
  return <span className="faint num" style={{ fontSize: "0.85rem" }}>Best {best}</span>;
}
