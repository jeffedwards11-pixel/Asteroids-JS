# Changelog

All notable changes to Asteroids-JS will be recorded here.
Format is intended to be readable as release notes.

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