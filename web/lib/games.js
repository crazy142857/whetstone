// The hub's list of games, grouped into sections. A new game gets an entry
// here and its own route under app/. `status: "soon"` shows it as a teaser
// card.
export const SECTIONS = [
  {
    title: "AI security",
    blurb:
      "Using AI at work safely: what it reads, what you paste into it, and what you let it do. Start with Spot the Injection; the field guide collects every lesson.",
    games: [
      {
        slug: "injection",
        href: "/injection",
        name: "Spot the Injection",
        skill: "AI security",
        blurb:
          "Emails, web pages and documents your AI assistant is about to read. Find the hidden lines trying to give it orders, and don't flag the innocent ones.",
        status: "live",
      },
      {
        slug: "leak",
        href: "/leak",
        name: "Leak Check",
        skill: "AI security",
        blurb:
          "A colleague is about to paste this into a public chatbot. Tap the keys, personal data and confidential numbers before it goes, and keep what the AI needs.",
        status: "live",
      },
      {
        slug: "gatekeeper",
        href: "/gatekeeper",
        name: "Gatekeeper",
        skill: "AI security",
        blurb:
          "An AI agent wants to run a command, send an email or make a payment. Allow it, ask first, or block it?",
        status: "live",
      },
    ],
  },
  {
    title: "Reading data",
    games: [
      {
        slug: "correlation",
        href: "/correlation",
        name: "Guess the Correlation+",
        skill: "Reading data",
        blurb:
          "Eyeball a scatter plot and call r. Then the traps start: outliers, Simpson's paradox, spurious trends and curves that fool the number.",
        status: "live",
      },
    ],
  },
  {
    title: "Coming later",
    games: [
      {
        slug: "prompt-golf",
        name: "Prompt Golf",
        skill: "Working with AI",
        blurb: "Get a model to produce the target output in as few words as you can.",
        status: "soon",
      },
      {
        slug: "pipeline-tycoon",
        name: "Pipeline Tycoon",
        skill: "Data engineering",
        blurb: "Wire sources, transforms and checks into a pipeline that survives a week of messy data.",
        status: "soon",
      },
      {
        slug: "daily",
        name: "Daily puzzle",
        skill: "Everything",
        blurb: "One short puzzle a day, the same for the whole team. Compare notes over coffee.",
        status: "soon",
      },
    ],
  },
];

export const GAMES = SECTIONS.flatMap((s) => s.games);
