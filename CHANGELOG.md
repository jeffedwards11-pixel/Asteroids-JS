# Changelog

All notable changes to Asteroids-JS will be recorded here.
Format is intended to be readable as release notes.

## [2026-05-10] — v1.3 Leaderboard Access & Feedback

### Added
- Leaderboard now accessible from the Start Menu via a LEADERBOARD button — no game required to view scores
- Back button replaces Play Again on the leaderboard when accessed from the Start Menu
- Feedback form on both the Start Screen and Game Over screen — opens as a modal overlay, posts to Formspree, pre-fills player name on Game Over screen
- GitHub repo link on Start Screen

---

## [2026-05-10] — v1.2 Power-Ups, Lives & Polish

### Added
- **Player lives** — 3 lives per game; dying respawns the ship at center with 2 seconds of invulnerability (ship blinks during this window). Game over only when all lives are lost.
- **Power-up system** — one power-up drops per level (starting level 2) based on a weighted loot table. Power-ups float across the screen and expire after 10 seconds.
- **Brakes** (permanent) — press S to apply reverse thrust
- **Spread Shot** (2 tiers, permanent) — Tier 1: 3 bullets in a 30° arc. Tier 2: 5 bullets in a 60° arc.
- **Multi-Shot** (temporary, 5 sec) — hold Space for full-auto fire at 0.05s intervals
- **Accel Boost** (temporary, 8 sec) — 50% increase to thrust and braking
- **Full Stop** (3 uses, key 1) — instantly zeros ship momentum
- **Reaction Enhancement** (manual trigger, key 2) — slows all non-player objects by 50% for 5 seconds
- **Sonic Wave** (manual trigger, key 3) — emits a visible expanding ring from the ship; asteroids caught in the ring are destroyed or downgraded. Child fragments from the wave are immune to the same blast.
- **Shield** (passive, one-time) — absorbs one direct hit; the colliding asteroid is destroyed or split, children launch away from the player, and player velocity is dampened. Shield hitbox is 50% larger than the ship.
- **HUD strip** — fixed panel at the bottom of the canvas shows all power-up slots (dim = inactive, bright = active/held), lives as ship icons, and timers/use counts for active items
- **Pause menu** (P key) — freezes the game and shows a reference card listing every power-up, its label letter, and a one-line description
- **Debug/developer mode** (backtick, localhost only) — panel in the top-right corner; grants individual power-ups, jumps to any level, toggles invincibility. Scores from sessions where debug was opened are blocked from the leaderboard.

### Changed
- Player ship recolored to teal (`#40ffcc`); asteroids remain white for contrast
- Bullets recolored to orange (`#ffa040`)
- Spread Shot Tier 2 widened from 45° to 60° and increased from 3 to 5 bullets
- Multi-Shot changed from burst-per-trigger to continuous full-auto for the duration
- Sonic Wave changed from an instant screen-clear to a physical expanding ring with visual effect

### Fixed
- Shield no longer kills the player on the same hit that destroys the shield

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