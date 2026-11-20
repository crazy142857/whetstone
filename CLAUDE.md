# CLAUDE.md: Project context for Claude Code

Read at the start of every session. Keep it current: when a decision,
gotcha or fix would otherwise have to be re-explained, put it here.

## What this is

Whetstone: browser games a small data team plays to keep sharpening data
and AI skills, and meant to work as workplace training and upskilling too
(Ivan, 2026-11-20): plain language, realistic work scenarios, clear
takeaways. Practice, not hiring: the candidate tests are Touchstone, a
separate app and repo; don't share code between them. Original games only.
`README.md` has setup and deploy, `ROADMAP.md` what's built and next.

## Decisions

- **Stack:** Next.js 16.4.6 (exact pin; `npm install next@x` writes `^x`,
  re-pin by hand), React 19.3.1, plain JS, plain CSS (`app/globals.css`,
  CSS variables with a dark-mode block). `package.json` is
  `"type": "module"` so the tests import `lib/` directly with plain Node.
- **No database and no login yet.** Games run client-side; stats are in
  localStorage (`lib/client/history.js`, every access in try/catch).
  Privacy comes from Cloudflare Access on the hostname. When a leaderboard
  needs identity, use Access's JWT (see ROADMAP.md), not a home-made login.
- **The hub is `lib/games.js`.** A new game is an entry there plus its own
  route under `app/`; keep its logic pure in `lib/<game>/` with unit tests.
- **Seeded games share `lib/rng.js`.** Guess the Correlation+ is seeded: the same
  seed and round number always give the same round, which challenge links
  rely on (and a daily puzzle will). Don't use `Math.random()` inside round
  generation. Round kinds come from `roundKind` (3 plain rounds, then traps
  at rising odds, never two in a row, each trap kind once before repeats).
- **Every number in an explainer is computed from the round's points**
  (`lib/correlation/explain.js`), never from the generator's settings; the
  unit tests check that. Generators retry until the trap actually holds
  (e.g. the outlier swings r by >= 0.35, every Simpson group has the
  opposite sign to the pooled r), so keep those checks when changing one.
- **Before the guess a trap looks like any other round**: overlays (fit
  lines, group colours, the outlier ring) only appear on reveal.
- **AI security games (v0.2.0): Spot the Injection, Leak Check,
  Gatekeeper.** Hand-written scenarios (`lib/injection/scenarios.js`,
  `lib/leak/prompts.js`, `lib/gatekeeper/scenarios.js`), 8 per game dealt
  from the seed by `lib/security/deck.js`'s `dealDeck` (challenge links
  work the same way). They share `components/DeckGame.js` (intro, HUD,
  game over with takeaways, challenge link); each game supplies a `Round`
  component. Every scenario names one lesson in `lib/security/lessons.js`,
  which is also the `/field-guide` page; the unit tests check every lesson
  is taught by at least one scenario. New scenario: write it in the same
  plain, work-based voice, made-up names only, and don't use fake keys in
  a real provider's format (GitHub push protection would block the push).
  Leak Check prompts mark spans as `[[n|text]]`; each word is clickable
  so a span's boundaries aren't given away. History is per game in
  localStorage (`whetstone:<slug>:games`).

## Tests

From `web/`: `npm run lint` (zero warnings), `npm test` (unit, no build
needed), then `npx next build && npx next start -p 3008 &` and
`npm run test:e2e` (Playwright via `createRequire`, since the package is
ESM; plays a full game, checks every round type's reveal, no phone
horizontal scroll, no page errors).

## Deploy

Build, test, commit, then `GIT_SHA=$(git rev-parse --short HEAD) docker
compose up -d --build`. Host port 3008. After a dependency change,
regenerate `web/package-lock.json` with the container's npm (`docker run
--rm -v "$PWD":/app -w /app node:26-alpine npm install --package-lock-only
--ignore-scripts`). Deploys to the Mac mini need Ivan's written go-ahead
in the thread.
