# Whetstone

Short browser games that keep a small data team's skills sharp: practice,
not hiring (the hiring tests are a separate app, Touchstone). Original games
only.

The first game is **Guess the Correlation+**: each round shows a scatter
plot and you guess Pearson's r. After three warm-up rounds, traps appear:
an outlier that swings r, Simpson's paradox, spurious correlations between
unrelated trending series, and curves with r near zero. Every round ends
with a short "what just happened" explainer built from that round's own
numbers.

## Stack

Next.js 16.4.6 (exact pin), React 19.3.1, plain JavaScript and CSS, Node 26
in the container. No database yet: each game is pure client-side code, and
personal stats live in the browser's localStorage. See `ROADMAP.md` for
when that changes (team leaderboard).

## Develop

```bash
cd web
npm ci
npm run dev            # http://localhost:3008
npm run lint
npm test               # unit tests: stats, round generation, scoring, explainers
npx next build && npx next start -p 3008 &
npm run test:e2e       # plays a full game in Chromium, saves screenshots to web/shots/
```

## Deploy (Mac mini)

Host port **3008** (Groundwork 3002, Lampstand 3004, Touchstone 3006).

1. `cp .env.example .env` and fill in `CLOUDFLARE_TUNNEL_TOKEN` for a new
   tunnel (or add a public hostname to an existing one pointing at
   `http://web:3000`). Keep the token in 1Password "Claude Apps".
2. Put the hostname behind a **Cloudflare Access** application (email
   one-time PIN, the team's emails). The app has no login of its own, so
   Access is what keeps it private.
3. `GIT_SHA=$(git rev-parse --short HEAD) docker compose up -d --build`
4. `curl -s http://127.0.0.1:3008/api/health` -> `{"status":"ok"}`

The container runs read-only as the `node` user.
