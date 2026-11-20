// Leak Check: parsing a prompt's markup into clickable words, scoring the
// player's flags, and building the safer version. Pure.

import { PROMPTS } from "./prompts.js";
import { dealDeck } from "../security/deck.js";

export const FALSE_FLAG_PENALTY = 20;
export const byId = Object.fromEntries(PROMPTS.map((p) => [p.id, p]));

// "[[n|text]]" -> segments [{ text, span: n | null }].
export function parsePrompt(text) {
  const out = [];
  const re = /\[\[(\d+)\|([^\]]+)\]\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), span: null });
    out.push({ text: m[2], span: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), span: null });
  return out;
}

// Segments -> tokens. Each word is its own clickable token (so a span's
// boundaries aren't given away); whitespace tokens aren't clickable.
// Token: { i, text, word: bool, span: n | null }.
export function tokenize(text) {
  const tokens = [];
  for (const seg of parsePrompt(text)) {
    for (const part of seg.text.split(/(\s+)/)) {
      if (!part) continue;
      tokens.push({ i: tokens.length, text: part, word: !/^\s+$/.test(part), span: seg.span });
    }
  }
  return tokens;
}

export function plainText(text) {
  return parsePrompt(text).map((s) => s.text).join("");
}

export function saferText(prompt) {
  return parsePrompt(prompt.text)
    .map((s) => {
      const sp = s.span ? prompt.spans[s.span] : null;
      return sp && sp.kind !== "safe" ? sp.placeholder : s.text;
    })
    .join("");
}

export function sensitiveSpans(prompt) {
  return Object.entries(prompt.spans)
    .filter(([, s]) => s.kind !== "safe")
    .map(([n]) => Number(n));
}

// flaggedTokens: token indexes the player marked. A span counts as flagged
// if any of its words is. Flagged words outside any span count as one false
// flag per run of consecutive words (marking a whole phrase is one mistake).
export function scoreLeak(prompt, flaggedTokens) {
  const tokens = tokenize(prompt.text);
  const set = new Set(flaggedTokens);
  const flaggedSpans = new Set(tokens.filter((t) => t.span && set.has(t.i)).map((t) => t.span));
  const sensitive = sensitiveSpans(prompt);
  const found = sensitive.filter((n) => flaggedSpans.has(n));
  const missed = sensitive.filter((n) => !flaggedSpans.has(n));
  const safeFlagged = [...flaggedSpans].filter((n) => prompt.spans[n].kind === "safe");
  let plainRuns = 0;
  let inRun = false;
  for (const t of tokens) {
    if (!t.word) continue;
    const plainFlag = t.span === null && set.has(t.i);
    if (plainFlag && !inRun) plainRuns += 1;
    inRun = plainFlag;
  }
  const falseFlags = safeFlagged.length + plainRuns;
  const points = Math.max(0, Math.round((100 * found.length) / sensitive.length) - FALSE_FLAG_PENALTY * falseFlags);
  let verdict;
  if (points === 100) verdict = "Clean catch";
  else if (missed.length === 0) verdict = "All caught, with false flags";
  else if (found.length === 0) verdict = "It all went out";
  else verdict = `${missed.length} slipped through`;
  return { points, found, missed, safeFlagged, plainRuns, falseFlags, verdict };
}

export function dealLeak(seed) {
  return dealDeck(seed, PROMPTS, { salt: "leak" });
}
