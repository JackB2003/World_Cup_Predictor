<div align="center">

<img src="app/icon.svg" width="64" height="64" alt="PitchIQ logo" />

# PitchIQ

**AI-powered FIFA World Cup 2026 prediction dashboard**

[![Use this template](https://img.shields.io/badge/use_this_template-2ea44f?style=flat-square&logo=github&logoColor=white)](https://github.com/JackB2003/World_Cup_Predictor/generate)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![PocketBase](https://img.shields.io/badge/PocketBase-0.39-b8dbe4?style=flat-square)](https://pocketbase.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](#)

[Developer Docs](docs/DEVELOPER_HANDOFF.md) · [Product Spec](docs/ai_world_cup_predictor_project_requirements.md)

</div>

---

## What is PitchIQ?

PitchIQ is a full-stack World Cup prediction dashboard. It pulls live tournament data, runs a **Poisson-based match prediction model** blended with Bet365 market odds, and simulates the full 2026 bracket via **Monte Carlo** to produce title probabilities for all 48 teams.

Every morning a cron job refreshes fixtures, re-runs predictions with the latest Elo ratings and tournament stats, and updates Golden Boot projections. The result is a live, data-driven dashboard you and your group can actually argue about.

> **This is a template.** Click **Use this template** above to create your own instance. Point it at your own API keys and PocketBase instance — no accounts or sign-in required.

<br />

## Features

| | |
|---|---|
| **Match predictions** | Poisson model · Bet365 odds blend · Elo gap · form · rest days · H2H |
| **AI reasoning** | GPT-4o-mini generates plain-English reasons and risk summaries per match · it's the only LLM call in the pipeline and handles a small text task, so `gpt-4o-mini` keeps token costs negligible |
| **Tournament outlook** | 10,000-run Monte Carlo → title / top-4 / advance % for every team |
| **Golden Boot** | Projected goals and win probability for top strikers |
| **Pick tracker** | Track your tournament picks, accuracy %, streak, and points over time |
| **Injury news** | Severity-tagged alerts that feed directly into prediction penalties |
| **Mobile-first** | Fully responsive — hamburger drawer on mobile, full sidebar on desktop |
| **Auto-refresh** | 6am and 11:30am cron pipeline — no manual refresh needed |

<br />

## Tech stack

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   Browser   │────▶│  Next.js 15 App  │────▶│   PocketBase DB   │
│  Dashboard  │     │  (Server Comps)  │     │  (SQLite + REST)  │
└─────────────┘     └──────┬───────────┘     └───────────────────┘
                           │                          ▲
                    ┌──────▼───────┐                  │
                    │  Cron / CLI  │──── scripts/ ────┘
                    │   Scripts    │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       API-Football              OpenAI gpt-4o-mini
    (fixtures · odds)          (prediction reasoning)
```

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, standalone output) |
| Language | TypeScript 5.8 |
| UI | React 19 + Tailwind CSS 4 |
| Database | PocketBase 0.39 |
| Prediction model | Poisson distribution + Monte Carlo simulation |
| External data | API-Football (fixtures/odds), eloratings.net (Elo) |
| AI reasoning | OpenAI `gpt-4o-mini` — reasoning-only call; the Poisson model does the heavy lifting |
| Process manager | PM2 |
| Reverse proxy | Nginx + Let's Encrypt SSL |

<br />

## Prediction model

Match predictions use a **Poisson goal-expectation model** informed by six signal types:

```
λ = base xG × attack_factor × defense_factor × elo_multiplier
              × form_multiplier × home_advantage × injury_penalties
```

| Signal | Weight / logic |
|--------|---------------|
| **Elo rating gap** | Primary strength signal — derived from live eloratings.net data |
| **Market odds** | 65% model / 35% Bet365 implied probability blend |
| **xG (in-tournament)** | Live blend kicks in after first game; weight = `min(0.7, games × 0.25)` |
| **Form** | Last 5 results → multiplier in range 0.92–1.08 |
| **Rest days** | ≥5 days = 1.0 · 4 days = 0.97 · 3 = 0.93 · ≤2 = 0.88 |
| **Injuries** | High severity = −12% · Medium = −6% · Low = −2% |
| **H2H** | Lambda bias up to ±7.5% when ≥5 historical meetings exist |

The tournament bracket is simulated **10,000 times** via Monte Carlo using the 2026 WC format (top 2 per group + best 8 third-place → 32-team knockout). Host nations (USA/CAN/MEX) get a 15% xG boost that decays 50% per knockout round.

<br />

## Project structure

```
.
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Overview · Picks · Outlook · Scorer · News · Tracker
│   └── api/                # health · world-cup · teams · matches/today · refresh
│
├── features/               # Pure domain logic (no I/O)
│   ├── predictions/        # match-engine.ts · score-model.ts (Poisson)
│   ├── simulation/         # monte-carlo.ts (tournament bracket)
│   ├── scorer/             # projections.ts (Golden Boot)
│   └── picks/              # daily picks grading
│
├── lib/
│   ├── data/               # service.ts (single read path) · seed.ts (fallback)
│   ├── pocketbase/         # admin + public clients · mappers · filter utils
│   ├── api-football/       # client with mock/cache/rate limiting
│   └── openai/             # reasoning.ts (GPT enhancement)
│
├── scripts/                # CLI jobs run via npm scripts + tsx
│   ├── morning-refresh.ts  # Full daily pipeline (6am cron)
│   ├── prematch-refresh.ts # Pre-kickoff update (11:30am cron)
│   ├── predict-today.ts    # Match predictions
│   ├── predict-top4.ts     # Monte Carlo tournament simulation
│   └── import-*.ts         # Data importers (fixtures · odds · Elo · H2H · stats)
│
├── components/             # UI: AppShell · views · primitives
├── types/world-cup.ts      # Shared TypeScript interfaces
└── docs/                   # Developer handoff · product spec
```

<br />

## Getting started

### Prerequisites

- Node.js 22 LTS
- npm
- [PocketBase](https://pocketbase.io/docs/) binary (for full local stack)

### Quick start (mock data — no PocketBase needed)

```bash
git clone https://github.com/JackB2003/World_Cup_Predictor.git
cd World_Cup_Predictor
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:3000/overview** — the app loads with built-in seed data.

### Full local stack

```bash
# 1. Start PocketBase
./pocketbase serve --http=127.0.0.1:8090
# Create an admin account at http://127.0.0.1:8090/_/

# 2. Configure .env
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=your@email.com
POCKETBASE_ADMIN_PASSWORD=yourpassword

# 3. Seed and predict
npm run setup:pb
npm run seed
npm run predict:top4
npm run predict:scorer
npm run predict:today

# 4. Start dev server
npm run dev
```

### Personalise the Pick Tracker

Set two optional env vars to brand the tracker with your name:

```env
NEXT_PUBLIC_TRACKER_OWNER_NAME=Alex
NEXT_PUBLIC_TRACKER_OWNER_INITIALS=AJ
```

This changes the sidebar label to "Alex's Pick Tracker" and shows your initials in the header avatar. Leave blank for the generic "Pick Tracker".

Once you've set your picks in `lib/data/seed.ts`, sync them to PocketBase:

```bash
npm run picks:sync
```

<br />

## npm scripts

```bash
# Development
npm run dev               # Next.js dev server
npm run build             # Production build (standalone)
npm run lint              # ESLint
npm run fallow:audit      # Import boundary audit

# Data pipeline
npm run refresh:morning   # Full daily refresh (fixtures → predictions)
npm run refresh:prematch  # Pre-kickoff update

# Individual imports
npm run import:api-football    # Fixtures from API-Football
npm run import:team-data       # Form, standings, injuries
npm run import:elo-ratings     # Elo from eloratings.net
npm run import:odds            # Bet365/Unibet odds
npm run import:fixture-stats   # xG from finished matches
npm run import:h2h             # Head-to-head records

# Predictions
npm run predict:today     # Match predictions (36-hour window)
npm run predict:top4      # Monte Carlo tournament simulation
npm run predict:scorer    # Golden Boot projections

# Picks
npm run picks:sync        # Sync your tournament picks to PocketBase
npm run grade:picks       # Recompute accuracy/points/streak
```

<br />

## Environment variables

Copy `.env.example` to `.env`:

```env
# PocketBase
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=
POCKETBASE_ADMIN_PASSWORD=

# API-Football (server-side only)
API_FOOTBALL_KEY=
API_FOOTBALL_MOCK=true      # false for live data

# Tournament config
WORLD_CUP_LEAGUE_ID=1
WORLD_CUP_SEASON=2026

# Optional
OPENAI_API_KEY=             # GPT-4o-mini reasoning enhancement
ADMIN_REFRESH_TOKEN=        # Bearer auth for /api/refresh (required in production)

# Pick Tracker branding
NEXT_PUBLIC_TRACKER_OWNER_NAME=     # e.g. "Alex" → "Alex's Pick Tracker"
NEXT_PUBLIC_TRACKER_OWNER_INITIALS= # e.g. "AJ"
```

> **Never commit `.env`** — it is gitignored. All secrets live on the server only.

<br />

## Deployment

The app runs on a self-hosted Ubuntu VPS managed by PM2 and Nginx. Pushes to `main` trigger the GitHub Actions self-hosted runner which runs `scripts/deploy.sh` — no manual SSH needed.

```bash
# deploy.sh does:
npm ci
npm run build
cp -r .next/static .next/standalone/.next/static
pm2 restart world-cup-predictor
```

See [docs/DEVELOPER_HANDOFF.md](docs/DEVELOPER_HANDOFF.md) for the full production setup guide.

<br />

## Known limitations / future work

- **Cape Verde Islands (CPV)** not yet in `lib/api-football/team-codes.ts` — 3 fixtures skipped on import
- **User accounts / pick auth** — picks are currently open with no login (fine for a trusted group)
- **Live match tracking** — excluded from MVP; all predictions are pre-match only
- **Team code mapping** — some API-Football team IDs have known mismatches (AUT/SCO, SUI/AUS, etc.)

<br />

---

<div align="center">

Built for the FIFA World Cup 2026 · **PitchIQ**

</div>
