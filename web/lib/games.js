// The hub's list of games. A new game gets an entry here and its own
// route under app/. `status: "soon"` shows it as a teaser card.
export const GAMES = [
  {
    slug: "correlation",
    href: "/correlation",
    name: "Guess the Correlation+",
    skill: "Reading data",
    blurb:
      "Eyeball a scatter plot and call r. Then the traps start: outliers, Simpson's paradox, spurious trends and curves that fool the number.",
    status: "live",
  },
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
];
