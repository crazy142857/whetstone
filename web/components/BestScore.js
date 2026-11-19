"use client";

import { useEffect, useState } from "react";
import { bestScore } from "@/lib/client/history";

export default function BestScore() {
  const [best, setBest] = useState(0);
  useEffect(() => setBest(bestScore()), []);
  if (!best) return null;
  return <span className="faint num" style={{ fontSize: "0.85rem" }}>Best {best}</span>;
}
