# Changelog

All notable changes to Asteroids-JS will be recorded here.
Format is intended to be readable as release notes.

## [2026-05-10] — v1.1 Levels

### Added
- Wave-based levels: clear all asteroid fragments to advance, with a level transition banner between waves
- Difficulty scales every 3 levels in a cycle: more asteroids → faster asteroids → shorter spawn-in interval
- Asteroids now spawn into each wave one by one (staggered entry) rather than all at once
- Level number displayed in the HUD alongside score during gameplay

### Changed
- Asteroids now wrap around screen edges instead of disappearing off-screen
- Game over and leaderboard screens now show a dimmed canvas behind them, preserving the final game state as atmosphere
- Leaderboard appears as a frosted panel over the dimmed canvas

### Fixed
- Score/level HUD was incorrectly visible on all screens; now only shows during gameplay

---

## [2026-05-09] — v1.0 Live

### Added
- Netlify deployment with `netlify.toml` and `build.sh` that generates `config.js` from environment variables at build time
- Supabase leaderboard fully wired: scores save on submission, leaderboard shows top 3 this week and top 10 all time

### Changed
- Ship no longer decelerates — true inertia, no drag (space is frictionless)
- Submit button now resets to "SUBMIT SCORE" at the start of each game over screen instead of carrying over stale state

### Fixed
- Submit button stuck on "SAVING…" between sessions
- Unhandled errors during score submission now show "ERROR — TRY AGAIN" and re-enable the button instead of freezing the UI
- Supabase variable name conflict with CDN global resolved by renaming internal client to `supabaseClient`

---

## [2026-05-09]
### Added
- `game.js` with canvas setup, four-state game state machine, input tracking, main game loop with delta time, button wiring, and leaderboard population logic
- Player ship with rotation, thrust, friction, speed cap, and screen wrapping
- Bullet firing with cooldown, lifetime expiry, and screen wrapping
- Asteroids spawning from screen edges in all three sizes, moving inward at random angles
- Asteroid split logic: large → 2 medium → 2 small → destroyed, children spread at random angles with increased speed
- Collision detection: bullets destroy asteroids and award points, player collision triggers game over
- Game over screen with final score display, auto-focused name input, and Enter key submission
- `leaderboard.js` with Supabase client, score saving, weekly top 3, and all-time top 10 queries


### Added
- Project scaffolding: `.gitignore`, `config.js` template, `README.md`
- `constants.js` with all tunable game values (player, bullets, asteroids, scoring, screen size)
- `index.html` with canvas, all UI screens (start, game over, leaderboard), and score display