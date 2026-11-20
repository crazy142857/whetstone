# Roadmap

## Built
- v0.1.0: the hub, Guess the Correlation+ (plain rounds; outlier, Simpson's
  paradox, curve and spurious traps; scoring with lives and streaks;
  explainers), challenge links (`/correlation?seed=...` replays the same
  game), personal stats per device.
- v0.2.0: AI security games, written as workplace training. Spot the
  Injection (14 scenarios: overrides, fake system messages, hidden text,
  data in image links, hijacked tools, steered answers, planted memories,
  encoded instructions, and clean rounds where the instructions are meant
  for people), Leak Check (10 prompts: secrets, personal data,
  confidential business info, internal system names, and look-alikes that
  are safe), Gatekeeper (16 agent actions: allow, ask or block). A field
  guide page with every lesson, takeaways at the end of each game, per-game
  stats.

## Next
- **Team leaderboard and synced stats.** Needs identity and storage: read
  the player from Cloudflare Access's `Cf-Access-Authenticated-User-Email`
  header (verify the `Cf-Access-Jwt-Assertion` JWT, don't trust the header
  alone), and Postgres + Prisma like Groundwork/Lampstand for scores.
- **Daily puzzle**: the same seed for everyone each day (date-based seed),
  one attempt, team results the next morning.
- **Practice mode** per trap type, for working on a weak spot.
- More trap types for Guess the Correlation+: restricted range,
  heteroscedastic fans, clusters, Anscombe-style lookalikes.

- **AI security, more**: a jailbreak round type (recognising role-play and
  "for a novel" tricks), phishing written by AI, deepfake voice and
  invoice checks, a "team training" mode where a manager sends one
  challenge link and sees who completed it (needs the leaderboard's
  identity and storage).

## Later games (ideas)
- **Prompt Golf**: reach a target output with the shortest prompt.
- **Pipeline Tycoon**: build a data pipeline that survives a week of bad data.
