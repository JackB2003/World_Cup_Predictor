# Handoff: World Cup 2026 Predictor Dashboard ("PitchIQ")

## Overview
PitchIQ is an AI-powered prediction dashboard for the 2026 FIFA World Cup (USA · Canada · Mexico). It helps a user make the best possible **pre-match** picks across daily matches, the overall tournament, and the Golden Boot race. It is **prediction-only — there is no live in-game tracking.** Data refreshes on a schedule (a morning pass, plus an optional pre-match pass 1–2 hours before the first kickoff); picks lock at kickoff.

The bundle is a working clickable prototype with six views, a dark/light theme, and a tweak panel.

## About the Design Files
The files in this bundle are **design references created in HTML/React (via Babel-in-browser)** — a prototype showing the intended look, content, and behavior. **They are not production code to ship directly.** The task is to **recreate these designs in your target codebase** using its established framework, component library, and patterns (React, Vue, SwiftUI, etc.). If no environment exists yet, pick the most appropriate stack and implement there. Treat the inline styles and the single CSS file as a *specification of intent*, not as code to paste in.

The data layer (`data.js`) is **illustrative mock data**. In production, wire these same shapes to your real data source (the plan referenced API-Football / a backend such as PocketBase). The component contracts below map 1:1 to the mock objects.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are all specified. Recreate the UI faithfully using your codebase's libraries. The exact hex values, type scale, and tokens are listed under **Design Tokens**.

---

## Information Architecture
A fixed left **sidebar** (collapsible to icons under 1080px) + a scrolling **main** column with a sticky **topbar**. Six routes:

1. **Overview / Command Center** (`overview`) — daily briefing hub
2. **Today's Picks** (`picks`) — per-match AI predictions
3. **Tournament Outlook** (`outlook`) — championship odds & power rankings
4. **Top Scorer Watch** (`scorer`) — Golden Boot projections
5. **News & Injury Alerts** (`news`) — intel that moves the model
6. **Pick Tracker** (`tracker`) — the user's picks, accuracy & points

---

## Screens / Views

### 1. Overview / Command Center
- **Purpose**: At-a-glance daily briefing; jump-off point to every other view.
- **Layout**: 2-column responsive grid (`1.5fr 1fr`, `gap: 18px`). A full-width hero spans both columns, then four cards below.
- **Components**:
  - **Hero banner** (full width): lime→cyan gradient (`linear-gradient(110deg, var(--accent), #9be63a 60%, var(--accent-3))`), dark text `#07090F`, diagonal hatch overlay at 12% opacity. Contains: host label with flag icon, "Kickoff in" display heading (40px), a **live countdown** (days/hrs/min/sec, updates every 1s), a "Matches today" number (52px), and a dark CTA button "View today's picks".
  - **Lock of the Day** card: highest-confidence match (compact match card — see Today's Picks). Header tag "Highest-confidence pick".
  - **Title Race** card: top 5 teams, each a crest + name + probability bar + percentage. Bars animate width on mount.
  - **Top Scorer Race** card: top 4 players, rank + crest + name + mini bar + projected goals.
  - **High-Impact Alerts** card: filters `news` to `sev === "high"`; icon chip + title + impact + time.
- **Behavior**: every card header "more" link calls `go(routeId)` to navigate. Countdown is live via `setInterval`.

### 2. Today's Picks
- **Purpose**: Review the AI prediction for each of today's matches and the reasoning behind it.
- **Layout**: A segmented filter (All / High confidence) + a refresh-status badge, then a responsive card grid (`repeat(auto-fill, minmax(420px, 1fr))`, `gap: 18px`). Cards stagger-animate in.
- **MatchCard component** (the core reusable unit):
  - **Meta row**: stage label (e.g. "Group A · MD2"), kickoff time with clock icon, and a status badge ("High confidence" = green, "Upset watch" = amber, "Coin flip" = gray, "Lean"/default = accent).
  - **Teams row**: `1fr auto 1fr` grid. Home crest(42px) + name + Elo on the left, the **predicted score** (40px Bebas Neue numerals, `nowrap`) center, away team mirrored right.
  - **Pick + confidence row**: an **"AI Pick"** label (bolt icon, accent) + the pick text; a **tri-bar** (home-win % / draw % / away-win %) colored home-color / gray / away-color; the three percentages beneath; and a **confidence %** at right (color-coded: ≥65 green, ≥50 accent, else amber).
  - **Expandable detail** (toggles on card click, `max-height` transition to 380px): "Why the model picks this" — a checklist of reasons; a **Risk factor** callout (amber-tinted box, info icon) describing what could go wrong; and a **Data freshness** line ("updated 7:02 AM · picks lock at kickoff").
  - Footer hint: "Tap for AI reasoning" / "Hide reasoning".
- **Behavior**: one card open at a time (accordion). Filter swaps the list. Clicking a card toggles its reasoning.

### 3. Tournament Outlook
- **Purpose**: See who the model favors to win it all and why.
- **Layout**: `1.5fr 1fr` grid. Left: Championship Probability card. Right column: Final Four + Prediction Weights. Full-width Power Rankings below (2-col internal grid).
- **Components**:
  - **Championship Probability**: top 10 teams sorted by `titleProb`, each a rank + crest + name + bar (scaled to leader) + percentage + trend delta (▲/▼/—). Tag: "Monte Carlo · 10,000 simulations".
  - **The Final Four**: top 4 by `titleProb`, medal-colored rank chips (gold/silver/bronze/slate), crest, name, top-4 odds %.
  - **Prediction Weights**: a stacked horizontal bar of the model's factor weights, then a legend list. Weights: Team Strength/Elo 25, Recent Form 20, Attack & Defense 20, Injuries & Suspensions 15, Tournament Context 10, Public Odds/Sentiment 5, AI News Analysis 5.
  - **Power Rankings**: all teams sorted by Elo; rank + crest + name + one-line scouting note + W/D/L form pills + Elo + trend.

### 4. Top Scorer Watch
- **Purpose**: Track the projected Golden Boot winner and the scoring race.
- **Layout**: A hero row (`360px 1fr`): leader spotlight card + a 6-tile formula breakdown. Then a full-width leaderboard.
- **Components**:
  - **Leader spotlight**: large crest (68px) with a boot-icon badge, player name (26px display), team + position, projected goals (44px) and win probability (44px).
  - **Formula breakdown**: 3-col tiles — Proj. matches, Expected mins, Goals/90, Penalty taker (green if yes), Group difficulty, Injury risk (green if low).
  - **Leaderboard rows**: grid `30px 40px 1fr 120px 70px 44px` — rank, crest, player + note, Golden-Boot-probability bar, projected goals, trend. "PK" badge if penalty taker.

### 5. News & Injury Alerts
- **Purpose**: Surface the latest injury/suspension/lineup/odds intel and show its model impact. **Scheduled refresh, not live.**
- **Layout**: `1fr 300px`. Left: a type filter (All / Injuries & bans / Lineups / Odds) + a stagger list of news items. Right: Alert Summary + a Refresh-schedule explainer card.
- **NewsItem component**: team crest with a severity-colored type-icon badge (cross=injury, card=suspension, rotate=lineup, info=news, trend=odds); severity badge (High impact=red / Medium=amber / Low=gray); type label; timestamp; title; body; and a **"Model impact"** accent badge (e.g. "−1.4% title prob", "CAN win prob −9%").
- **Copy note**: the explainer must say **pre-match only, no live tracking** — "a morning refresh updates results, standings, injuries & top scorers, with an optional pre-match pass 1–2 hrs before the first kickoff."

### 6. Pick Tracker
- **Purpose**: The user's own predictions, accuracy, and points.
- **Layout**: A 4-up KPI strip, then `1fr 1fr`: Tournament Predictions card + (Accuracy trend + Prediction History) stacked.
- **Components**:
  - **KPI strip**: Total points (accent), Global rank (#312 of 48,910), Pick accuracy (64%), Hot streak (4, with fire icon).
  - **Tournament Predictions**: the user's one-time picks — Top-4 finish list (each with on-track=green / at-risk=amber status badge) and Top scorer pick.
  - **Accuracy Over Time**: big % + a sparkline of `accuracyTrend`.
  - **Prediction History**: rows of past match, pick, result (hit=green check / miss=red cross), and points awarded.
- **Possible enhancement requested by stakeholder**: add a side-by-side **AI pick vs. user pick vs. result** comparison column (not yet built).

---

## Interactions & Behavior
- **Navigation**: sidebar items and card "more" links set the active route via `go(id)`, which also scrolls `.main` to top. Active nav item gets an accent left-rail indicator.
- **Entrance animation**: pages use a **transform-only** slide-up (`translateY(12px) → 0`, 0.5s) — *never opacity-based hiding* (so print/PDF/reduced-motion always show content). Lists use staggered delays (`.stagger`). Gate motion behind `@media (prefers-reduced-motion: no-preference)`.
- **Match card accordion**: click toggles an expandable reasoning panel (max-height transition). One open at a time.
- **Filters**: segmented controls on Today's Picks (All / High confidence) and News (type filter).
- **Bars & rings**: probability bars and confidence rings animate from 0 to value on mount (CSS width / SVG stroke-dashoffset transitions, ~0.9–1s easing `cubic-bezier(.2,.8,.2,1)`).
- **Countdown**: live, `setInterval` 1s, on the Overview hero.
- **Theme switch**: toggling dark/light adds a transient `theme-switching` class to `<html>` that suppresses transitions for 80ms so surface colors snap cleanly (avoids a stuck mid-fade). Do **not** transition `background` on theme-variable surfaces.
- **Refresh button**: reloads (placeholder for a real re-fetch).

## State Management
- `tab` — active route id (string).
- Tweak state (persisted): `accent` ("lime"|"cyan"|"magenta"|"violet"|"amber"), `theme` ("dark"|"light"), `density` ("compact"|"regular"|"comfy"), `showReasoning` (bool).
- Per-card local `open` state (which match card's reasoning is expanded).
- Countdown ticks via interval; bar/ring fills via mount effects.
- In production, replace the in-memory `window.WC` object with fetched data of the same shape; recompute derived values (sorts, maxes for bar scaling) on the client.

## Design Tokens
Defined in `styles.css` `:root` (dark) with `[data-theme="light"]` overrides.

**Accent (tweakable, default = lime):**
- Lime `#C6FF3D` (rgb 198,255,61) — default
- Cyan `#36D1FF` · Magenta `#FF3D7F` · Violet `#9B7BFF` · Amber `#FFB23D`
- Secondary accents always available: `--accent-2` `#FF3D7F`, `--accent-3` `#36D1FF`, `--accent-warm` `#FFB23D`

**Dark surfaces:** bg `#07090F`, bg-2 `#0C0F18`, surface `#11151F`, surface-2 `#161B27`, elevated `#1C2230`; lines `rgba(255,255,255,0.07)` / `0.13`.
**Light surfaces:** bg `#EEF1F6`, bg-2 `#E6EAF1`, surface `#FFFFFF`, surface-2 `#F6F8FB`.
**Text (dark):** `#EEF2F8` / mid `#AEB7C7` / dim `#6E7689`. **(light):** `#0E1422` / `#4A5468` / `#8B95A7`.
**Semantic:** good `#38E08A`, mid/warn `#FFB23D`, bad `#FF5C6C`.

**Typography (Google Fonts):**
- Display / headings: **Archivo** (700–900, letter-spacing −0.02em)
- Body / UI: **Hanken Grotesk** (400–700)
- Numerals / stats: **Bebas Neue** (with `font-feature-settings: "tnum"`)
- Scale: page H1 26px; card H3 15px; section-tag 10–10.5px uppercase 0.16em tracking; big stat numerals 30–52px; body 13–14.5px.

**Radius:** sm 10px, base 16px, lg 22px; chips/pills 11–12px; crests ~24% of size. **Shadow (hover lift):** `0 18px 50px -20px rgba(0,0,0,0.7)` (dark). **Card border:** 1px `--line`.

**Spacing:** grid gaps 18px (12 compact / 24 comfy); card padding 20px (15 / 26 by density); page padding 6px 30px 48px.

## Assets
- **No external image assets.** Team "crests" are CSS chips showing the 3-letter country code on the team's primary color (see `Crest` in `components.jsx`). Swap for real flag/crest images in production if desired.
- **Icons**: a hand-built inline-SVG set (`ICONS` in `components.jsx`, stroke-based, inherit `currentColor`). Replace with your icon library (e.g. Lucide — most map directly: grid, trophy, bell, target, bolt, refresh, check, x, etc.).
- **Fonts**: loaded from Google Fonts (Archivo, Hanken Grotesk, Bebas Neue).

## Files
- `PitchIQ Dashboard.html` — entry point; loads fonts, CSS, and all scripts in order.
- `styles.css` — all design tokens, base styles, component classes, theme overrides, responsive rules.
- `data.js` — mock data (`window.WC`): `teams`, `teamMap`, `matches`, `scorers`, `news`, `userPicks`, `modelWeights`, `meta`. **This is the data contract.**
- `components.jsx` — shared primitives & icons: `ICONS`, `Crest`, `ProbBar`, `ConfRing`, `FormRow`, `Sparkline`, `Delta`, `CardHead`, `Stat`.
- `picks.jsx` — `MatchCard`, `TriBar`, `TodaysPicks`.
- `outlook.jsx` — `TournamentOutlook`.
- `scorer.jsx` — `TopScorer`.
- `news.jsx` — `NewsAlerts`, `PickTracker`.
- `overview.jsx` — `Overview`, `Countdown`, `MatchCardLite`.
- `app.jsx` — app shell: sidebar, topbar, routing, theme/accent application, tweaks panel.
- `tweaks-panel.jsx` — tweak panel host wiring (prototype-only; not needed in production).

> Note on architecture: scripts are transpiled in-browser via Babel and share scope through `window` assignments (`Object.assign(window, {...})`). This is a **prototype convenience** — in production use real module imports/exports and a build step.
