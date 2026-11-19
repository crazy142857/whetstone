# Roadmap

## Built
- v0.1.0: the hub, Guess the Correlation+ (plain rounds; outlier, Simpson's
  paradox, curve and spurious traps; scoring with lives and streaks;
  explainers), challenge links (`/correlation?seed=...` replays the same
  game), personal stats per device.

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

## Later games (ideas)
- **Prompt Golf**: reach a target output with the shortest prompt.
- **Pipeline Tycoon**: build a data pipeline that survives a week of bad data.
