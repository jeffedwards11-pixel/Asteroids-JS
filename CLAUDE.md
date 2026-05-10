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
START SCREEN → GAMEPLAY → LEVEL TRANSITION → GAMEPLAY → … → GAME OVER → NAME ENTRY → LEADERBOARD → START SCREEN

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
- Asteroid collision mechanics
- Lives
- Power ups: Brakes, Multi Shot, Spread Shot, Sonic Wave, Acceleration/Deceleration, Full Stop
- Visual polish and sound


## Phase 2 — Levels (designed, not yet built)

### Model: Wave-based
All asteroids (including fragments) must be cleared to advance. No continuous spawning during a wave. When the wave is cleared, a level transition banner is shown, then the next wave begins.

### HUD during gameplay
Display both score and level number on screen at all times during gameplay.

### Staggered spawn-in
Asteroids do not all appear at once. They spawn in one by one with a delay (`LEVEL_SPAWN_INTERVAL_BASE`). This delay shortens as levels progress.

### Difficulty cycle (repeats every 3 levels)
- **+1 count tier** (levels 1, 4, 7, 10…): more large asteroids per wave
- **+1 speed tier** (levels 2, 5, 8, 11…): all asteroids move faster
- **+1 interval tier** (levels 3, 6, 9, 12…): spawn-in delay decreases

### Difficulty table (first 7 levels)
| Level | Large asteroid count | Speed multiplier | Spawn-in interval |
|-------|---------------------|-----------------|-------------------|
| 1     | 3                   | 1.0×            | 1.5s              |
| 2     | 3                   | 1.2×            | 1.5s              |
| 3     | 3                   | 1.2×            | 1.2s              |
| 4     | 4                   | 1.2×            | 1.2s              |
| 5     | 4                   | 1.4×            | 1.2s              |
| 6     | 4                   | 1.4×            | 0.9s              |
| 7     | 5                   | 1.4×            | 0.9s              |

### Formulas (level N, 1-indexed)
```js
countTier    = Math.floor((level - 1) / 3)   // 0,0,0,1,1,1,2…
speedTier    = Math.floor((level + 1) / 3)   // 0,1,1,1,2,2,2…
intervalTier = Math.floor(level / 3)         // 0,0,1,1,1,2,2…

asteroidCount  = LEVEL_ASTEROID_BASE + countTier * LEVEL_ASTEROID_INCREMENT
speedMult      = LEVEL_SPEED_MULTIPLIER ** speedTier
spawnInterval  = max(LEVEL_SPAWN_INTERVAL_MIN, LEVEL_SPAWN_INTERVAL_BASE - intervalTier * LEVEL_SPAWN_INTERVAL_DECREMENT)
```

### Constants to add to constants.js
```
LEVEL_ASTEROID_BASE            = 3
LEVEL_ASTEROID_INCREMENT       = 1
LEVEL_SPEED_MULTIPLIER         = 1.2
LEVEL_SPAWN_INTERVAL_BASE      = 1.5   // seconds between staggered spawns
LEVEL_SPAWN_INTERVAL_DECREMENT = 0.3
LEVEL_SPAWN_INTERVAL_MIN       = 0.3
LEVEL_TRANSITION_DURATION      = 2     // seconds to show level banner
```

### Ship behaviour between levels
Ship does NOT reset position or velocity between waves. Momentum carries over.

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
