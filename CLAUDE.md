# Asteroids-JS Project Brief

## What This Is
A browser-based Asteroids game built in Vanilla JS + HTML5 Canvas.
Ported from a Python/pygame version: https://github.com/jeffedwards11-pixel/Asteroids
Target audience: friends and family, including a 9 year old learning to code.
Shareable via URL — no installs required for players.

## Tech Stack
- Vanilla JavaScript + HTML5 Canvas (no frameworks, no build tools)
- Supabase for leaderboard persistence
- Netlify for hosting

## File Responsibilities
- `index.html` — canvas element and UI screens only
- `game.js` — all game logic
- `leaderboard.js` — all Supabase interaction (only this file touches Supabase)
- `constants.js` — every tunable game value lives here, nothing hardcoded in game.js
- `config.js` — Supabase credentials, gitignored, never committed

## Architecture Rules
- No frameworks, no libraries except the Supabase JS client
- All game values (speeds, sizes, points, spawn rates) must live in constants.js
- leaderboard.js is the only file that imports from config.js or talks to Supabase
- Keep game logic and leaderboard logic completely separate

## Game Screens / State Flow
START SCREEN → GAMEPLAY → GAME OVER → NAME ENTRY → LEADERBOARD → START SCREEN

## Supabase Schema
```sql
scores (
  id uuid primary key,
  username text not null,
  score integer not null,
  created_at timestamp with time zone default now()
)
```

## Leaderboard Queries
- Top 10 all time: order by score desc limit 10
- Top 3 this week: where created_at > now() - interval '7 days' order by score desc limit 3

## Phase 1 Scope (do not build beyond this)
- Port core gameplay from Python version faithfully
- Live score display during gameplay
- Points: Large asteroid 20pts, Medium 50pts, Small 100pts
- Game over screen with final score
- Name entry prompt after game over
- Leaderboard screen with top 3 this week and top 10 all time
- Play Again button

## Phase 2 (do not build yet, just be aware)
- Difficulty settings
- Levels
- Lives
- Power ups
- Visual polish and sound

## Changelog
After every completed task, update CHANGELOG.md in the project root.
Use this format:

### [YYYY-MM-DD]
#### Added
- Brief description of new things

#### Changed
- Brief description of modifications

#### Fixed
- Brief description of bug fixes

Do not log every small edit — only meaningful changes worth reviewing later.
The changelog should be readable as release notes by a non-technical person.
