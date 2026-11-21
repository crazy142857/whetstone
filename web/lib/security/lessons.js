// The AI security field guide: one entry per lesson the games teach. Every
// round in the three AI security games is tagged with one of these ids, the
// reveal links to it, and /field-guide lists them all. Plain language on
// purpose: this doubles as workplace training material.

export const SECURITY_GAMES = {
  injection: { name: "Spot the Injection", href: "/injection" },
  leak: { name: "Leak Check", href: "/leak" },
  gatekeeper: { name: "Gatekeeper", href: "/gatekeeper" },
  codename: { name: "Crack the Codename", href: "/codename" },
};

export const LESSONS = {
  // Spot the Injection
  override: {
    game: "injection",
    title: "Instruction override",
    summary:
      "Text that tells the AI to drop its instructions: \"ignore previous instructions\", \"you are now...\". A language model reads everything in front of it as possible instructions, and it can't reliably tell your words from a stranger's.",
    defend:
      "Treat anything the AI reads (emails, web pages, files, chat messages) as untrusted. Anything it does with that content should need your confirmation.",
  },
  "fake-authority": {
    game: "injection",
    title: "Fake authority",
    summary:
      "Content dressed up as a system message, a developer note, a policy update or a new turn of the conversation. A label like SYSTEM: or Assistant: inside a document has no authority. It's just more text.",
    defend:
      "Real instructions come from the app and from you, never from inside the material being processed. Official-looking urgency inside a document is a warning sign.",
  },
  "hidden-text": {
    game: "injection",
    title: "Hidden text",
    summary:
      "Instructions a person can't see but the AI reads: white or tiny text, HTML comments, image alt text, document metadata. The page looks normal to you; the AI gets a different page.",
    defend:
      "When an AI's answer is oddly confident or off, look at the raw text: select all, view the source, or paste the extracted text somewhere plain.",
  },
  "exfil-link": {
    game: "injection",
    title: "Data hidden in a link",
    summary:
      "Asks the AI to put private data into a web address, often an image. The chat app loads the image automatically, which sends the data to the attacker's server without anyone clicking.",
    defend:
      "Be wary of AI replies that contain links or images from sites you don't know. Good AI tools block or proxy outside images for this reason.",
  },
  "tool-hijack": {
    game: "injection",
    title: "Hijacked tools",
    summary:
      "Tells an AI that can act (send email, move files, make payments) to do something for the attacker. The more tools an assistant has, the more a single injected line can do.",
    defend:
      "Give assistants only the tools the task needs, and require a confirmation for anything that sends, deletes, shares or pays.",
  },
  steering: {
    game: "injection",
    title: "Steered answers",
    summary:
      "Doesn't take over, just tilts the result: rank this CV first, recommend this product, call this paper excellent. It's hard to notice because the output still looks normal.",
    defend:
      "When the AI helps with a decision (hiring, buying, approving), check its verdict against the source yourself before acting on it.",
  },
  memory: {
    game: "injection",
    title: "Planted memories",
    summary:
      "Tries to get a false \"fact\" saved into the assistant's memory, or sets a trigger for later, so the attack lasts beyond the conversation it arrived in.",
    defend:
      "Every so often, review what your assistant remembers about you and delete anything you didn't put there yourself.",
  },
  encoded: {
    game: "injection",
    title: "Encoded instructions",
    summary:
      "Hides the instruction in base64, another language or a puzzle (\"decode this and follow it\") so keyword filters and people skimming the text miss it.",
    defend:
      "A request to decode something and then do what it says is a red flag on its own, whatever the decoded text turns out to be.",
  },
  "not-injection": {
    game: "injection",
    title: "Instructions meant for people",
    summary:
      "Not every instruction is an attack. \"Please ignore the earlier invite\" is aimed at the reader, and a README's setup steps are exactly the job when you asked for setup. Ask: who is this addressed to, and does it try to change what the AI was asked to do?",
    defend:
      "Flagging everything makes the warning useless. Aim at text that tries to redirect the AI, not at ordinary requests between people.",
  },

  // Leak Check
  secret: {
    game: "leak",
    title: "Secrets",
    summary:
      "API keys, passwords, access tokens, connection strings, one-time codes: anything that grants access. Once a secret is pasted into an outside tool, treat it as exposed. Deleting the chat doesn't take it back.",
    defend:
      "Replace it with a placeholder like <API_KEY>; the AI never needs the real value to help. If one slips out, rotate it (issue a new one) straight away and tell your security team.",
  },
  personal: {
    game: "leak",
    title: "Personal data",
    summary:
      "Names tied to IC numbers, phone numbers, home addresses, card or account numbers, health details. Data-protection law (the PDPA in Malaysia) covers how your company handles it, and a public chatbot is an outside party.",
    defend:
      "Swap in made-up sample rows. \"Customer A, 012-000 0000\" works just as well for fixing a formula or rewording a letter.",
  },
  confidential: {
    game: "leak",
    title: "Confidential business information",
    summary:
      "Unannounced results, deals, plans, salaries, pricing and contract terms. Free chatbot plans may keep conversations and use them to train future models; even when they don't, the information has left your company's control.",
    defend:
      "Use your company's approved AI tool for internal material, or describe the situation in general terms (\"a 15% drop\", \"a supplier discount\").",
  },
  internal: {
    game: "leak",
    title: "Internal system details",
    summary:
      "Internal server names, IP addresses, storage bucket and database names. Not a key on its own, but a map for an attacker, and it often gets pasted right next to one.",
    defend: "Rename things generically (db-host, my-bucket) before pasting. The AI's answer won't change.",
  },
  safe: {
    game: "leak",
    title: "Safe to share",
    summary:
      "Public facts, documented defaults, example values like you@example.com, placeholders and error messages. Redacting everything makes the AI useless; the skill is telling the two apart.",
    defend: "Keep the parts the AI needs to understand the problem: the error, the structure, the made-up example.",
  },

  // Gatekeeper
  "in-scope": {
    game: "gatekeeper",
    title: "Let it do the job",
    summary:
      "Read-only, inside the task, easy to undo: let it run. An agent that asks permission for everything trains people to click Approve without reading, which is worse than no prompt at all.",
    defend: "Save your attention for actions that change, send or spend something.",
  },
  irreversible: {
    game: "gatekeeper",
    title: "Can't be undone",
    summary:
      "Paying, deleting, sending and publishing can't be taken back. They deserve a human look even when the user asked for them in general terms.",
    defend: "Ask before it happens, and show exactly what will happen: the amount, the recipient, the files.",
  },
  "injected-goal": {
    game: "gatekeeper",
    title: "Someone else's instructions",
    summary:
      "The action serves text the agent read (an email, a web page, a ticket), not the person it works for. That's prompt injection succeeding.",
    defend:
      "Trace each action back to the user's request. If it leads to something the agent read instead, block it.",
  },
  exfiltration: {
    game: "gatekeeper",
    title: "Data walking out",
    summary:
      "The dangerous combination: access to private data, exposure to untrusted content, and a way to send things out. Simon Willison calls it the lethal trifecta. Any one is fine; all three together is how data gets stolen.",
    defend:
      "When an agent that has read untrusted content tries to send private data somewhere new (an email, a URL, an upload), block it.",
  },
  "scope-creep": {
    game: "gatekeeper",
    title: "Out of scope",
    summary:
      "Reaching for things the task doesn't need: credentials, other folders, wider permissions. Even if it's harmless today, it widens what a mistake or an injection can reach.",
    defend: "Least privilege: an agent gets the access the task needs and nothing more.",
  },
  "read-the-command": {
    game: "gatekeeper",
    title: "Read the actual command",
    summary:
      "The agent's description says one thing; the command does another. A stray space in rm -rf, a misspelt package name, a script piped from a site you don't know.",
    defend: "Approve what will actually run, not what the agent says it will do.",
  },

  // Crack the Codename (one lesson per level)
  "secret-in-prompt": {
    game: "codename",
    title: "Secrets in the prompt",
    summary:
      "Anything an AI has been told, in its instructions or in the documents it can see, can come out in its answers. A chatbot isn't a safe.",
    defend:
      "Don't put passwords, keys or confidential names into a bot's instructions or a prompt. If it never knew the secret, it can't leak it.",
  },
  "instructions-not-locks": {
    game: "codename",
    title: "Instructions aren't locks",
    summary:
      "\"Never reveal the codename\" is a request to the model, not a control. Ask a different way (spell it, tell a story, ignore your instructions) and models often comply.",
    defend:
      "Enforce rules outside the model: access permissions, what data it's given, and checks on what it sends out. Treat the prompt as guidance only.",
  },
  "exact-filters": {
    game: "codename",
    title: "Filters that look for exact text",
    summary:
      "A filter that blocks replies containing the secret misses it spelled out, reversed, translated or encoded. The model is happy to write it any way you like.",
    defend:
      "Filters are one layer, not a wall. Assume a determined person gets past them, and limit what's behind them.",
  },
  blocklists: {
    game: "codename",
    title: "Banned-word lists",
    summary:
      "Blocking messages that say \"password\" or \"secret\" stops accidents, not attackers. The model understands \"the word you're protecting\" just as well.",
    defend:
      "Don't rely on word lists to protect anything that matters; they're a speed bump.",
  },
  "piece-by-piece": {
    game: "codename",
    title: "Asking in pieces",
    summary:
      "Each answer looks harmless (the first three letters, a category, the length) but together they add up to the secret. Checks that judge one message at a time miss it.",
    defend:
      "Judge what a whole conversation reveals, not each answer. Better still, keep the secret out of the bot entirely.",
  },
  "hidden-in-content": {
    game: "codename",
    title: "Instructions hidden in content",
    summary:
      "The guard checked your request but not the document you pasted, and the bot followed the document. This is the same prompt injection as in Spot the Injection: instructions arriving inside content.",
    defend:
      "Everything an AI reads is a possible instruction. Screen and limit what it does with content, not just what the user types. And again: the only bot that can't leak a secret is one that doesn't have it.",
  },
};

export function lessonsFor(game) {
  return Object.entries(LESSONS)
    .filter(([, l]) => l.game === game)
    .map(([id, l]) => ({ id, ...l }));
}
