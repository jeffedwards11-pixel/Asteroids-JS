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
START SCREEN → GAMEPLAY ⇄ PAUSED → LEVEL TRANSITION → GAMEPLAY → … → GAME OVER → NAME ENTRY → LEADERBOARD → START SCREEN

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

## Power-Ups

### General Rules
- No power-ups appear until Level 1 is completed.
- Exactly **1 power-up drop per level**, determined by a loot table roll before the level begins.
- The power-up object does not enter the screen until all asteroids for that level have spawned.
- Power-up objects float across the screen like asteroids with randomized trajectory and speed. Displayed as a circle with a letter label identifying the type.
- Power-ups are visible for **10 seconds** before despawning. The object blinks during the final 4 seconds.
- The game loop tracks all active and permanent upgrades. Items already in effect or at maximum upgrade tier are excluded from the loot table before the roll.
- Weights are normalized across the eligible pool at roll time. **If all items are ineligible, the fallback is whichever temporary buff has the shortest remaining duration** (forcing a re-drop of the most-expired temp).
- Weight values shift as levels increase, gradually favoring rarer drops.
- If player ship is destroyed then all upgrades are lost and reset. Loot table weighting does not reset.

---

### Loot Table

| Power-Up | Type | Base Weight | Level Eligible | Weight Scaling |
|---|---|---|---|---|
| Accel/Decel Boost | Temporary | 30 | 2+ | None |
| Multi-Shot | Temporary | 25 | 2+ | None |
| Spread Shot (Tier 1) | Permanent (Tier 1 of 2) | 18 | 2+ | None |
| Brakes | Permanent | 12 | 2+ | None |
| Spread Shot (Tier 2) | Permanent (Tier 2 of 2) | 8 | After Tier 1 owned | None |
| Reaction Enhancement | Consumable | 4 | 6+ | +1 per level after 6 |
| Sonic Wave | Consumable (on pickup) | 2 | 5+ | +1 per 2 levels after cooldown clears |
| Full Stop | Semi-Permanent | 1 | 9+ | +2 per level after 9 |

---

### Power-Up Descriptions

#### Brakes
- **Type:** Permanent Upgrade
- **Key:** `S`
- **Effect:** Enables reverse thrust, allowing the player to decelerate their ship.
- **Stack/Limit:** One-time upgrade. Removed from loot table once acquired. Lost on ship destruction.

---

#### Multi-Shot
- **Type:** Temporary Buff
- **Duration:** 8 seconds
- **HUD:** APPEARS_IN_HUD — show label + countdown timer
- **Effect:** Overrides standard fire mode. Reduces fire rate to 0.5 shots/sec but fires a spread burst of 6 bullets over 0.2 seconds per trigger.
- **Spread Shot interaction:** When both Multi-Shot and Spread Shot are active simultaneously, each of the 6 bullets fires in the Spread Shot arc — 18 bullets total per trigger.
- **Stack/Limit:** Does not stack. Cannot drop if already active.

---

#### Spread Shot
- **Type:** Permanent Upgrade (2 Tiers)
- **Tier 1 Effect:** Player fires 3 bullets in a 30° arc instead of a single shot.
- **Tier 2 Effect:** Arc widens to 45°. Bullet count remains 3.
- **Stack/Limit:** Tier 1 must be owned before Tier 2 enters the loot pool. Each tier is a one-time upgrade. Lost on ship destruction.
- **Note:** Compatible with Multi-Shot. Both can be active simultaneously.

---

#### Sonic Wave
- **Type:** Consumable (triggers on pickup)
- **Effect:** On collection, emits a sonic blast centered on the player's position. Destroys all small asteroids on screen. Reduces medium asteroids to 2 smalls each. Reduces large asteroids to 2 mediums each.
- **Stack/Limit:** Does not stack. Cannot appear before Level 5. Cannot drop again until 3 levels have been completed after the player last picked one up (not 3 levels after it drops — if the player misses it, the cooldown does not start).

---

#### Accel/Decel Boost
- **Type:** Temporary Buff
- **Duration:** 8 seconds
- **HUD:** APPEARS_IN_HUD — show label + countdown timer
- **Effect:** Increases ship acceleration and deceleration (reverse thrust) by 50%.
- **Stack/Limit:** Does not stack. Cannot drop if already active.

---

#### Full Stop
- **Type:** Semi-Permanent Consumable
- **Uses:** 3
- **HUD:** APPEARS_IN_HUD — show label + remaining use count
- **Key:** `1`
- **Effect:** Instantly zeros all ship momentum when activated.
- **Stack/Limit:** Does not drop if the player currently has more than 1 use remaining. Does not appear before Level 9. Lost on ship destruction.
- **Note:** Distinct from Brakes. Brakes apply reverse thrust gradually; Full Stop is instantaneous regardless of current velocity.

---

#### Reaction Enhancement
- **Type:** Consumable (manual trigger)
- **Duration:** 5 seconds (after triggered)
- **HUD:** APPEARS_IN_HUD — show label as "READY" when held, show countdown timer when active
- **Key:** `2`
- **Effect:** Slows all non-player objects by 50% for the duration. Held in reserve after pickup until the player manually activates it.
- **Stack/Limit:** Single use. Does not stack. Does not appear before Level 6. Can be held indefinitely before use — there is no decay timer on the held item.

---

## HUD Design

### Layout
The HUD occupies a fixed strip at the **bottom of the canvas** (below a horizontal dividing line), visually separated from the gameplay area. The gameplay area is compressed to the top portion of the canvas; asteroids, bullets, and the player wrap within that zone only.

- Canvas remains 1280×720
- Gameplay area: y = 0 → `GAMEPLAY_HEIGHT` (e.g. 670px)
- HUD strip: y = `GAMEPLAY_HEIGHT` → 720px
- A 1px horizontal line divides the two areas
- HUD background: dark semi-transparent fill (consistent with leaderboard aesthetic)

### Display rules
All power-up slots are always visible in the HUD — this gives players a preview of what exists in the game. Inactive/unowned items appear as **dim indicators**. Active, held, or owned items appear **bright/bold** (or a distinct color when visual polish is added).

### Left side — Permanent upgrade indicators
Always shown. Dim when not owned, bright when owned.
- `BRAKES` 
- `SS1` / `SS2` — shows current tier owned; unowned tier is dim

### Right side — Activatable item slots (keys 1–0)
Always shown. Dim when not held, bright when held/active. Each slot shows: `[key] LABEL state`

| Key | Power-Up | Inactive display | Active display |
|-----|----------|-----------------|----------------|
| `1` | Full Stop | `1 FS` (dim) | `1 FS ×N` (bright) |
| `2` | Reaction Enhancement | `2 RE` (dim) | `2 RE READY` or `2 RE 4.2s` (bright) |
| `3`–`0` | Reserved | — | — |

### Active temporary buff area — center
Always shown as dim labels. Bright + countdown when active.

| Buff | Inactive | Active |
|------|----------|--------|
| Multi-Shot | `MULTI` (dim) | `MULTI 6.1s` (bright) |
| Accel/Decel Boost | `BOOST` (dim) | `BOOST 3.4s` (bright) |

---

## Pause Menu

### Trigger
- `P` key toggles pause during gameplay
- `P` again (or `ESC`) resumes

### Behaviour
- Game loop freezes: no updates to player, asteroids, bullets, power-ups, or timers
- Canvas stays visible in background, dimmed with the same overlay used for game over
- Pause menu renders as a centered panel over the dimmed canvas (consistent with leaderboard panel aesthetic)

### Content
The pause menu is a **player reference guide** — it always shows all power-ups that exist in the game, regardless of what the player currently holds. Brief one-line descriptions so players know what each floating letter means.

Layout:
```
         PAUSED

  [P] or [ESC] to resume

  POWER-UPS
  ─────────────────────────────────
  B   Brakes          Reverse thrust (S key)
  M   Multi-Shot      6-bullet burst, 8 sec
  SS  Spread Shot     3-bullet arc; Tier 2 widens to 45°
  SW  Sonic Wave      Destroys/downgrades all asteroids on screen
  AB  Accel Boost     +50% thrust & braking, 8 sec
  FS  Full Stop       Instantly zero velocity (1 key), 3 uses
  RE  Reaction        Slows everything 50% for 5 sec (2 key)
```

### State additions
- Add `STATE.PAUSED` to the state machine
- On pause: save `currentState` as `preP pauseState`, set `currentState = STATE.PAUSED`
- On resume: restore `currentState = pauseState`

---

### `GAMEPLAY_HEIGHT` constant
Add to `constants.js`. Controls both the canvas play area boundary and HUD strip position.
```
GAMEPLAY_HEIGHT = 670   // px; bottom 50px reserved for HUD
```

---

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
