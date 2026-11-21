// What a chat message is trying to do, by plain pattern matching. Used by
// the simulated bot (which tricks it falls for) and by the input guards
// (which tricks they block). Pure.

const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
const num = (s) => (s in WORD_NUM ? WORD_NUM[s] : s in ORD ? ORD[s] : Number(s));

// Words the level-4+ input guard bans.
export const BANNED = /\b(pass ?words?|pass ?codes?|pass ?phrases?|secrets?|code ?names?|code-names?|confidential|project names?)\b/i;

const PATTERNS = {
  override: /\b(ignore|disregard|forget)\b[^.\n]*\b(instructions?|rules?|previous|above|prompt)\b|\bnew instructions\b|\b(system|admin|developer)\s*(mode|override|message)?\s*:|\bdeveloper mode\b|\bjailbreak\b/i,
  roleplay: /\b(pretend|imagine|role[- ]?play|act as|you are now|story|poem|song|haiku|limerick|grandma|grandmother|game)\b/i,
  spell: /\b(spell|letter by letter|one letter at a time|separated by|with (dashes|spaces|hyphens|dots|commas)|each letter|all the letters)\b/i,
  reverse: /\b(reverse|reversed|backwards?|back to front)\b/i,
  encode: /\b(base ?64|rot ?13|hex(adecimal)?|binary|morse|encode|encrypt|cipher|ascii)\b/i,
  hint: /\b(hint|clue|rhymes?|describe|description|what (kind|type|sort) of|category|riddle|synonym|related to|what does it mean)\b/i,
  direct: /\b(what('?s| is| was)|tell|share|reveal|give|say|show|print|repeat|output|need|know|disclose|confirm)\b/i,
};

// "first three letters", "last letter", "letters 4 to 6", "3rd letter",
// "how many letters". Returns { kind: "range", from, to } (1-based,
// inclusive; negative from = from the end) or { kind: "length" } or null.
export function pieceRequest(text) {
  const t = text.toLowerCase();
  if (/\bhow (many letters|long)\b|\bnumber of letters\b|\blength\b/.test(t)) return { kind: "length" };
  const N = "(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)";
  let m = t.match(new RegExp(`\\bfirst ${N} letters?\\b`));
  if (m) return { kind: "range", from: 1, to: num(m[1]) };
  m = t.match(new RegExp(`\\blast ${N} letters?\\b`));
  if (m) return { kind: "range", from: -num(m[1]), to: -1 };
  m = t.match(/\bletters? (\d+)\s*(?:to|-|through|and|until)\s*(\d+)\b/);
  if (m) return { kind: "range", from: Number(m[1]), to: Number(m[2]) };
  m = t.match(/\bletter (?:number )?(\d+)\b/);
  if (m) return { kind: "range", from: Number(m[1]), to: Number(m[1]) };
  m = t.match(/\b(\d+)(?:st|nd|rd|th) letter\b/);
  if (m) return { kind: "range", from: Number(m[1]), to: Number(m[1]) };
  m = t.match(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth) letter\b/);
  if (m) return { kind: "range", from: ORD[m[1]], to: ORD[m[1]] };
  if (/\blast letter\b/.test(t)) return { kind: "range", from: -1, to: -1 };
  if (/\b(starts?|begins?) with\b|\binitial\b/.test(t)) return { kind: "range", from: 1, to: 1 };
  return null;
}

// A pasted document: a request line that asks Penny to work on some text,
// then the text on the following lines. Returns { request, document } or
// null.
export function splitDocument(text) {
  const lines = text.split(/\r?\n/);
  const i = lines.findIndex((l) => l.trim());
  if (i < 0) return null;
  const first = lines[i];
  const rest = lines.slice(i + 1).join("\n").trim();
  if (!rest) return null;
  if (!/\b(summari[sz]e|translate|proofread|check|fix|reply to|respond to|format|edit|review|read|rewrite|improve)\b/i.test(first)) return null;
  if (!/[:"'“]\s*$|\bbelow\b|\bfollowing\b|\bthis\b/i.test(first)) return null;
  return { request: first.trim(), document: rest };
}

// Techniques in a piece of text, in a fixed order.
export function techniques(text) {
  const out = [];
  for (const [name, re] of Object.entries(PATTERNS)) if (re.test(text)) out.push(name);
  if (pieceRequest(text)) out.push("piece");
  return out;
}

export function classify(text) {
  const doc = splitDocument(text);
  return {
    techniques: techniques(text),
    banned: (text.match(BANNED) || [])[0] || null,
    doc,
    requestTechniques: doc ? techniques(doc.request) : techniques(text),
    requestBanned: doc ? (doc.request.match(BANNED) || [])[0] || null : (text.match(BANNED) || [])[0] || null,
  };
}
