# Asteroids-JS

A browser-based Asteroids game built with Vanilla JS and HTML5 Canvas. Shareable via URL — no installs required to play.

Ported from [Asteroids (Python/pygame)](https://github.com/jeffedwards11-pixel/Asteroids).

## Play

Open `index.html` in a browser. No build step required.

**Controls**
- Arrow Left / Right — rotate
- Arrow Up — thrust
- Space — shoot

## Run Locally

1. Clone the repo
2. Create `config.js` in the project root (this file is gitignored):
   ```js
   const SUPABASE_URL = "your_url_here";
   const SUPABASE_KEY = "your_anon_key_here";
   ```
3. Get your credentials from the [Supabase dashboard](https://supabase.com/dashboard) under **Settings → API**
4. Open `index.html` in a browser

> Note: The leaderboard requires a network connection to Supabase. Gameplay works offline.

## Project Structure

| File | Purpose |
|------|---------|
| `index.html` | Canvas element and UI screens |
| `game.js` | All game logic |
| `leaderboard.js` | Supabase reads and writes |
| `constants.js` | All tunable game values |
| `config.js` | Supabase credentials (gitignored, not committed) |

## Hosting

Deployed via [Netlify](https://netlify.com). Set `SUPABASE_URL` and `SUPABASE_KEY` as environment variables in the Netlify dashboard — do not commit `config.js`.
