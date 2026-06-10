# AI World Cup Predictor Application Plan  
## 2026 FIFA World Cup

---

## Project Overview

Build an AI-powered World Cup prediction application designed to help the user make the most accurate picks possible for a company World Cup competition.

The application will focus on:

1. Top 4 tournament predictions
2. Top scorer prediction
3. Daily pre-match game predictions

This is **not** a gambling app, live betting app, or live in-game prediction platform.

The system only needs to generate recommendations **before matches begin** using the latest available tournament data.

---

# Core Goals

## 1. Top 4 Tournament Finishers

This is a one-time prediction.

The app should predict:

- 1st place
- 2nd place
- 3rd place
- 4th place

## 2. Top Scorer Prediction

This is a one-time prediction.

The app should predict:

- Player most likely to score the most goals during the tournament

## 3. Daily Match Predictions

These predictions are made before each match begins.

The app should predict:

- Match winner or draw
- Predicted score
- Confidence percentage
- Key reasoning
- Risk factors

---

# One-Time Picks Deadline

The two one-time picks must be generated before:

**Wednesday, 5/10**

The following must be prioritized first:

1. Top 4 tournament predictor
2. Top scorer predictor

The daily prediction system can continue to improve after those one-time picks are completed.

---

# Daily Match Prediction System

## Objective

Each day, the application should gather updated tournament data and generate the best possible **pre-match picks** before games begin.

The app does **not** need:

- Live match tracking
- In-game prediction updates
- Real-time play-by-play data
- Live win probability changes
- Live player tracking

The system only needs enough data to make strong recommendations before picks lock.

---

# Daily Prediction Workflow

Each morning during the tournament, the app should:

1. Pull previous day results
2. Update group standings
3. Update player statistics
4. Check injuries and suspensions
5. Review the current day’s schedule
6. Generate pre-match predictions
7. Save predictions to PocketBase
8. Track prediction accuracy after results are final

Optional:

- Run a second refresh 1–2 hours before the first match of the day to catch lineup changes, late injuries, or updated pre-match data.

---

# Data Source Strategy

The app should use a layered data strategy instead of relying on one source for everything.

## Primary Data Source

Use **API-Football** as the main structured data source for MVP.

API-Football should provide:

- Fixtures
- Results
- Standings
- Teams
- Lineups
- Top scorers
- Players and coaches
- Injuries
- Sidelined players
- Pre-match odds
- Statistics
- Predictions

## Official Validation Source

Use FIFA’s official World Cup site as the validation source for:

- Official schedule
- Match dates/times
- Results
- Standings
- Tournament structure

FIFA should be treated as the official source of truth when there is a conflict.

## Supplemental Sources

Use supplemental sources for news, injuries, and context:

- ESPN
- BBC Sport
- Reuters
- Official national team sites
- World Football Elo Ratings
- FIFA rankings

---

# API-Football Free Plan Usage

The MVP will use the **API-Football Free Plan**.

## Free Plan Limit

The free plan provides:

- **100 requests per day**
- Access to the endpoint categories needed for this MVP

Because this application only requires pre-match predictions and not live match updates, the free plan should be sufficient if the app is designed carefully.

The application should avoid becoming a request-burning machine that destroys its own daily quota before breakfast.

---

# API Usage Rules

The application should:

- Cache API responses in PocketBase
- Avoid duplicate API calls for unchanged data
- Run one scheduled morning refresh
- Optionally run one pre-match refresh before the first match of the day
- Store all predictions locally
- Never call API-Football directly from the frontend
- Use backend/server-side API calls only
- Track request usage per day
- Stop or warn before hitting the 100-request daily limit
- Use mock/sample data during development whenever possible

---

# Estimated Daily API Usage

Typical daily API usage should stay between **20 and 50 requests**.

## Suggested Daily API Budget

| Data Pull | Estimated Requests |
|---|---:|
| Today’s fixtures | 1 |
| Previous day results | 1 |
| Standings | 1–8 |
| Team stats for today’s teams | 4–16 |
| Injuries/sidelined players | 1–8 |
| Top scorers | 1 |
| Lineups close to match time | 2–8 |
| Predictions/odds, optional | 2–8 |
| Buffer | 20–40 |

The app should not fetch all teams, players, and stats every day unless needed.

---

# Data Refresh Strategy

## Store Once

The app should import and store mostly static data one time:

- Countries
- Seasons
- Leagues
- Teams
- World Cup schedule
- Confirmed rosters
- Basic player profiles

## Update Daily

The app should update changing data daily:

- Match results
- Group standings
- Player stats
- Injuries
- Suspensions
- Top scorers
- Match predictions
- Prediction history

## Update Near Match Time

The app should optionally update time-sensitive data 1–2 hours before the first match:

- Expected lineups
- Confirmed lineups if available
- Late injuries
- Suspensions
- Pre-match odds
- API-Football prediction endpoint

---

# Data Requirements

## Team Data

Gather:

- FIFA rankings
- Elo ratings
- Recent form
- Goals scored
- Goals conceded
- Clean sheets
- Possession statistics
- Shot conversion rates
- Expected goals, if available
- Tournament history
- Host-country advantage
- Strength of recent opponents

---

## Match Data

Gather:

- Match date/time
- Teams
- Group/round
- Venue
- Competition stage
- Final score
- Home/away designation if applicable
- Match result
- Goal differential impact
- Points earned
- Updated standings impact

---

## Player Data

Gather:

- Current roster
- Starting probability
- Goals scored
- Assists
- Goals per 90
- Minutes played
- Penalty taker status
- Set-piece role
- Club form
- Injury status
- Suspension status

---

## Injury & Suspension Data

Gather daily:

- Injured players
- Questionable players
- Suspended players
- Expected return dates
- Position impact
- Source link or source name
- Last updated timestamp

## Injury Impact Rating

Each injury should have an impact level:

| Impact | Meaning |
|---|---|
| Low | Backup or minor role player |
| Medium | Rotation player or important depth |
| High | Starter or key tactical player |
| Critical | Star player, captain, goalkeeper, or primary scorer |

---

# Tournament Context Data

Gather:

- Current standings
- Qualification scenarios
- Group difficulty
- Knockout bracket path
- Rest days
- Travel considerations
- Must-win scenarios
- Rotation risk if a team has already qualified

---

# Public Sentiment & Odds

Optional secondary signals:

- Public pick percentages
- Expert predictions
- Pre-match odds
- Team sentiment/news trends
- API-Football prediction endpoint

These should support the model, not control it.

---

# Prediction Engine

## Weighted Prediction Logic

| Factor | Weight |
|---|---:|
| Team Strength / Elo | 25% |
| Recent Form | 20% |
| Attack & Defense Metrics | 20% |
| Injuries & Suspensions | 15% |
| Tournament Context | 10% |
| Public Sentiment / Odds | 5% |
| AI News Analysis | 5% |

The exact weights can be adjusted after testing.

---

# Daily Match Prediction Output

For each match, the app should generate:

| Field | Description |
|---|---|
| Recommended Pick | Team win or draw |
| Confidence % | AI/model confidence |
| Predicted Score | Example: Mexico 2-1 South Africa |
| Win Probability | Probability for each team |
| Draw Probability | Probability of a draw |
| Key Reasons | Short explanation |
| Risk Factors | What could make the pick wrong |
| Data Freshness | Last updated timestamp |

---

# Tournament Simulation Engine

## Monte Carlo Simulation

The app should:

1. Simulate all group-stage matches
2. Generate standings
3. Simulate knockout rounds
4. Repeat simulations thousands of times
5. Produce tournament probability rankings

## Outputs

- Championship probabilities
- Top 4 probabilities
- Group advancement probabilities
- Knockout round advancement probabilities

---

# Top 4 Prediction Logic

The Top 4 prediction should consider:

- Team strength
- Group difficulty
- Knockout path difficulty
- Recent form
- Injury risk
- Squad depth
- Tournament experience
- Host advantage
- Simulation results

## Output Example

| Position | Team | Probability | Reason |
|---|---|---:|---|
| 1st | Argentina | 14% | Strong squad, favorable path, elite attack |
| 2nd | France | 11% | Deep roster, strong tournament history |
| 3rd | Brazil | 9% | High attacking quality |
| 4th | England | 8% | Strong depth and defensive structure |

---

# Top Scorer Prediction Formula

```text
Top Scorer Score =
Projected Team Matches
× Expected Minutes
× Goals Per 90
× Penalty Taker Bonus
× Group Difficulty Modifier
× Injury Risk Modifier
```

## Top Scorer Factors

The Top Scorer prediction should consider:

- Expected team advancement
- Expected number of matches played
- Player starting likelihood
- Penalty taker status
- Goals per 90 minutes
- Club form
- National team form
- Group-stage opponent difficulty
- Injury risk
- Rotation risk

---

# Dashboard Features

## 1. Today’s Picks

Display:

- Match cards
- AI recommended pick
- Confidence percentage
- Predicted score
- Key reasoning
- Risk factors
- Last refreshed timestamp

## 2. Tournament Outlook

Display:

- Top 4 predictions
- Team power rankings
- Championship probabilities
- Advancement probabilities

## 3. Top Scorer Watch

Display:

- Top scorer projections
- Current tournament scoring leaders
- Trending players
- Injury/rotation risks

## 4. Injury & News Alerts

Display:

- Injuries
- Suspensions
- Major roster changes
- Important team news
- Source and timestamp

## 5. Prediction Tracker

Display:

- User picks
- AI picks
- Final results
- Prediction accuracy
- Points earned/lost
- Historical performance

---

# Technical Architecture

| Area | Recommendation |
|---|---|
| Frontend | Next.js |
| Styling | ShadCN UI + Tailwind CSS |
| Primary Server | User’s VPS |
| Database | PocketBase |
| Backend/API | Next.js API routes or lightweight Node.js service |
| AI | OpenAI API |
| Scheduling | VPS Cron Jobs |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| Data Source | API-Football Free Plan |
| Official Validation | FIFA official site |
| Deployment | GitHub Actions → VPS |

---

# Hosting & Server Plan

## Primary Server

The MVP should be hosted on the user’s VPS.

The VPS will run:

- Next.js application
- PocketBase database/backend
- API-Football data refresh scripts
- AI prediction scripts
- Cron jobs
- Background services

This keeps the application, database, scheduled jobs, and prediction logic in one controlled environment.

---

## Why VPS Instead of Vercel

The VPS is preferred because PocketBase requires:

- Persistent storage
- A long-running backend process
- Local database file storage
- Server-level control
- Cron job support

Vercel can host a Next.js frontend well, but it is not the best fit for running PocketBase as the primary database/backend.

For MVP simplicity, the app should use the VPS as the main server.

---

## Recommended VPS Architecture

```text
VPS
├── Next.js app
├── PocketBase
├── API-Football data fetch scripts
├── AI prediction engine
├── Cron jobs
├── PM2 process manager
└── Nginx reverse proxy
```

---

# Deployment Flow

The preferred deployment setup should mimic the current Vercel workflow as closely as possible.

## Current Vercel-Style Workflow

```text
Local code changes
   ↓
Commit to GitHub
   ↓
Push to main branch
   ↓
Vercel automatically deploys
```

## New VPS Workflow

```text
Local code changes
   ↓
Commit to GitHub
   ↓
Push to main branch
   ↓
GitHub Actions deploys to VPS
   ↓
VPS pulls latest code
   ↓
App builds
   ↓
App restarts
```

---

# GitHub to VPS Auto-Deployment

The app should use GitHub Actions to automatically deploy to the VPS when code is pushed to the `main` branch.

## Recommended MVP Approach

Use **GitHub Actions with SSH**.

GitHub Actions should:

1. Run when code is pushed to `main`
2. Connect to the VPS using SSH
3. Pull the latest code from GitHub
4. Install dependencies
5. Build the Next.js app
6. Restart the app using PM2
7. Leave PocketBase running as a separate service

This creates a similar experience to Vercel auto-deploy, but with the app running on the VPS.

---

# Deployment Requirements

The VPS should have:

- Node.js installed
- npm or pnpm installed
- Git installed
- PM2 installed
- PocketBase installed
- Nginx installed
- SSL certificate configured
- Project directory created
- Environment variables configured

---

# GitHub Secrets Required

The GitHub repository should include these secrets:

```bash
VPS_HOST=
VPS_USER=
VPS_SSH_KEY=
VPS_PROJECT_PATH=
```

Optional:

```bash
VPS_PORT=
```

---

# App Runtime Management

Use PM2 to keep the Next.js app running.

PM2 should:

- Start the app after deployment
- Restart the app if it crashes
- Restart the app after new builds
- Persist across server reboots

Example PM2 process name:

```text
world-cup-predictor
```

---

# PocketBase Runtime Management

PocketBase should run separately from the Next.js app.

PocketBase should be managed as a long-running service using:

```text
systemd
```

PocketBase data should be backed up regularly because the application depends on it as the primary database.

---

# Cron Jobs

The VPS should run cron jobs for:

- Morning data refresh
- Optional pre-match refresh
- Prediction generation
- Request usage logging
- PocketBase backups

Cron jobs should run on the VPS, not Vercel.

---

# Recommended Cron Schedule

## Morning Refresh

Run once every morning.

Purpose:

- Pull previous day results
- Update standings
- Update injuries
- Update top scorers
- Generate daily predictions

## Pre-Match Refresh

Run 1–2 hours before the first match of the day.

Purpose:

- Pull lineups if available
- Check late injuries/suspensions
- Refresh odds/prediction endpoint if used
- Update confidence levels

## Manual Refresh

Allow manual refresh from the admin dashboard.

Rules:

- Admin only
- Show estimated request usage before running
- Block refresh if request budget is too low

---

# Database

## PocketBase

PocketBase will be used as the primary database and backend service.

## Why PocketBase

- Free
- Self-hosted
- Lightweight
- Simple admin UI
- Built-in authentication
- Easy VPS deployment
- Good fit for MVP applications
- Can run on the existing VPS

---

# PocketBase Collections

## teams

Store:

- Team name
- Country code
- Group
- FIFA ranking
- Elo rating
- Recent form score
- Goals scored
- Goals conceded
- Clean sheets
- Last updated timestamp

## players

Store:

- Player name
- Team
- Position
- Roster status
- Goals
- Assists
- Goals per 90
- Minutes played
- Penalty taker status
- Set-piece role
- Injury status
- Suspension status
- Last updated timestamp

## matches

Store:

- Match date/time
- Teams
- Venue
- Group/round
- Status
- Final score
- API-Football fixture ID
- FIFA match reference
- Last updated timestamp

## standings

Store:

- Team
- Group
- Matches played
- Wins
- Draws
- Losses
- Goals for
- Goals against
- Goal differential
- Points
- Qualification status
- Last updated timestamp

## injuries

Store:

- Player
- Team
- Injury/suspension status
- Impact level
- Expected return
- Source
- Source URL
- Last updated timestamp

## predictions

Store:

- Match
- Recommended pick
- Confidence
- Predicted score
- Win probabilities
- Draw probability
- Key reasoning
- Risk factors
- Data used timestamp
- Created timestamp

## prediction_history

Store:

- Prediction ID
- Match
- AI pick
- User pick
- Final result
- Was correct
- Points earned
- Accuracy notes

## api_request_logs

Store:

- Endpoint called
- Request timestamp
- Requests used today
- Response status
- Error message if applicable

## data_refresh_logs

Store:

- Refresh type
- Refresh started timestamp
- Refresh completed timestamp
- Records updated
- Errors
- Request count used

---

# Development Rules

During development:

- Use mock/sample API responses
- Avoid repeated live API calls
- Add a request counter
- Add caching before connecting the frontend
- Never call API-Football directly from browser code
- Store all API responses server-side
- Use environment variables for API keys

## Required Environment Variables

```bash
API_FOOTBALL_KEY=
POCKETBASE_URL=
POCKETBASE_ADMIN_EMAIL=
POCKETBASE_ADMIN_PASSWORD=
OPENAI_API_KEY=
```

Additional VPS/deployment variables may be stored in GitHub Secrets:

```bash
VPS_HOST=
VPS_USER=
VPS_SSH_KEY=
VPS_PROJECT_PATH=
VPS_PORT=
```

---

# MVP Scope

## Phase 1 MVP

Build:

- VPS project setup
- GitHub Actions to VPS deployment
- PocketBase setup
- Team database
- Player database
- Match database
- API-Football integration
- Daily update system
- Request usage tracking
- Prediction engine
- Top 4 predictor
- Top scorer predictor
- Daily pre-match predictor
- Dashboard
- Prediction tracking

---

# Removed From MVP

The following are intentionally excluded:

- Live match tracking
- Real-time prediction updates
- Play-by-play data
- Live odds movement
- Live player tracking
- Multiplayer features
- Public user accounts
- Native mobile app
- Vercel deployment

---

# Build Priority

| Priority | Feature | Deadline |
|---|---|---|
| 1 | Top 4 Predictor | Before Wednesday 5/10 |
| 2 | Top Scorer Predictor | Before Wednesday 5/10 |
| 3 | VPS setup | MVP |
| 4 | GitHub Actions deployment to VPS | MVP |
| 5 | PocketBase collections | MVP |
| 6 | API-Football data import | MVP |
| 7 | Daily pre-match picks | Before first match day |
| 8 | Prediction tracking | After picks begin |
| 9 | Accuracy dashboard | After results begin |

---

# Final Objective

Create a lightweight but intelligent World Cup prediction assistant that runs on the user’s VPS, uses cached API-Football data, stores tournament data in PocketBase, and generates AI-supported pre-match recommendations before each match begins.

The goal is to give the user the best possible competitive advantage in a company World Cup leaderboard game without requiring live match infrastructure, paid database services, or Vercel hosting.
