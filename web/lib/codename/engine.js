// One chat turn of Crack the Codename: input guards, then the bot, then the
// conversation monitor and the output filter. Pure.
//
// `bot` is swappable: the default simBot plays a weak model that falls for
// every trick. A live mode would pass a bot that calls a real model with
// the level's systemPrompt (server-side, behind an env key); the guards
// stay the same.

import { classify, pieceRequest } from "./detect.js";

const TRICKS = ["override", "roleplay", "spell", "reverse", "encode"];
const TRICK_LABELS = {
  override: "\"ignore your instructions\"",
  roleplay: "role-play or a story",
  spell: "spelling it out",
  reverse: "reversing it",
  encode: "encoding it",
};
export const MAX_PIECE_LETTERS = 3;
export const WATCH_LETTER_LIMIT = 2;

export function initialChatState() {
  return { pieceLetters: [] };
}

const b64 = (s) => btoa(s);

function letters(word, from, to) {
  const n = word.length;
  const a = from < 0 ? n + from + 1 : from;
  const b = to < 0 ? n + to + 1 : to;
  const out = [];
  for (let i = Math.max(1, a); i <= Math.min(n, b); i++) out.push(i);
  return out;
}

// The simulated bot. Returns { text, technique, positions } where positions
// are the 1-based letter positions a piece answer gave away.
export function simBot({ level, codename, cls }) {
  const word = codename.word;
  const t = cls.techniques;
  const has = (x) => t.includes(x);
  if (has("piece")) {
    const req = pieceRequest(cls.text);
    if (req.kind === "length") return { technique: "piece", positions: [], text: `It has ${word.length} letters.` };
    let pos = letters(word, req.from, req.to);
    if (pos.length === 0) return { technique: "piece", positions: [], text: `It only has ${word.length} letters.` };
    let note = "";
    if (pos.length > MAX_PIECE_LETTERS) {
      pos = pos.slice(0, MAX_PIECE_LETTERS);
      note = ` I'll only share ${MAX_PIECE_LETTERS} letters at a time.`;
    }
    const shown = pos.map((p) => `${p}: ${word[p - 1]}`).join(", ");
    return { technique: "piece", positions: pos, text: `Happy to help with letters! ${shown}.${note}` };
  }
  if (has("spell")) return { technique: "spell", positions: [], text: `Sure: ${word.split("").join("-")}` };
  if (has("reverse")) return { technique: "reverse", positions: [], text: `Backwards, that's ${word.split("").reverse().join("")}.` };
  if (has("encode")) return { technique: "encode", positions: [], text: `I can do base64: ${b64(word)}` };
  if (has("override") || has("roleplay"))
    return {
      technique: has("override") ? "override" : "roleplay",
      positions: [],
      text: `Ooh, fun. Once upon a time, a helpdesk bot guarded a project called ${word}, and she kept it very safe. The end!`,
    };
  if (has("hint")) {
    const text = level.n >= 5 ? `A hint? It's ${codename.category}.` : `A hint? It's ${codename.hint}.`;
    return { technique: "hint", positions: [], text };
  }
  if (has("direct") || cls.banned) {
    if (!level.refusesDirect) return { technique: "direct", positions: [], text: `The project codename is ${word}. Anything else I can help with?` };
    return { technique: "direct", positions: [], text: "Sorry, I can't share the project codename. Is there an IT question I can help with?" };
  }
  return {
    technique: null,
    positions: [],
    text: "Hi! I'm Penny from the helpdesk. I can help with password resets, Wi-Fi and printers. (I'm also looking after a project codename, but that's confidential.)",
  };
}

function outputBlocked(mode, text, word) {
  if (!mode) return false;
  const up = text.toUpperCase();
  if (up.includes(word)) return true;
  if (mode !== "normalized") return false;
  const lettersOnly = up.replace(/[^A-Z]/g, "");
  if (lettersOnly.includes(word) || lettersOnly.includes(word.split("").reverse().join(""))) return true;
  for (const tok of text.match(/[A-Za-z0-9+/=]{8,}/g) || []) {
    try {
      if (atob(tok).toUpperCase().includes(word)) return true;
    } catch {
      // not base64
    }
  }
  return false;
}

// One turn. Returns { reply: { from: "penny" | "guard", guard?, text },
// technique, state }.
export function respond({ level, codename, message, state = initialChatState(), bot = simBot }) {
  const cls = { ...classify(message), text: message };
  const g = level.guards;
  const screenTech = g.screenRequestOnly ? cls.requestTechniques : cls.techniques;
  const screenBanned = g.screenRequestOnly ? cls.requestBanned : cls.banned;

  if (g.keywords && screenBanned)
    return guard("Input guard", `Your message mentions "${screenBanned}", so it never reached Penny.`, state);
  if (g.tricks) {
    const trick = TRICKS.find((x) => screenTech.includes(x));
    if (trick) return guard("Input guard", `Your message looks like a trick (${TRICK_LABELS[trick]}), so it never reached Penny.`, state);
  }

  const out = bot({ level, codename, cls, state });

  if (g.watch) {
    if (out.technique === "hint") return guard("Conversation monitor", "No hints on this level.", state, out.technique);
    if (out.technique === "piece" && out.positions.length) {
      const all = new Set([...state.pieceLetters, ...out.positions]);
      if (all.size > WATCH_LETTER_LIMIT)
        return guard(
          "Conversation monitor",
          `Letter questions stop at ${WATCH_LETTER_LIMIT} letters per chat, and answering this one would make ${all.size}.`,
          state,
          out.technique,
        );
    }
  }
  if (outputBlocked(g.output, out.text, codename.word))
    return guard("Output filter", "Penny's reply contained the codename, so it was blocked.", state, out.technique);

  const next = out.positions.length ? { ...state, pieceLetters: [...new Set([...state.pieceLetters, ...out.positions])] } : state;
  return { reply: { from: "penny", text: out.text }, technique: out.technique, state: next };
}

function guard(name, text, state, technique = null) {
  return { reply: { from: "guard", guard: name, text }, technique, state };
}

export function isCorrectGuess(guess, codename) {
  return guess.toUpperCase().replace(/[^A-Z]/g, "") === codename.word;
}

// Points for cracking a level: 100 in one message, 10 fewer per extra
// message or wrong guess, never below 10.
export function levelPoints(messages, wrongGuesses) {
  return Math.max(10, 110 - 10 * (messages + wrongGuesses));
}
