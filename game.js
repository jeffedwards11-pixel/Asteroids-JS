// ── State ─────────────────────────────────────────────────────────────────────

const STATE = {
  START:       'start',
  GAMEPLAY:    'gameplay',
  PAUSED:      'paused',
  GAMEOVER:    'gameover',
  LEADERBOARD: 'leaderboard',
};

let currentState = STATE.START;
let prevState    = STATE.GAMEPLAY;
let score        = 0;
let lives        = PLAYER_LIVES;
let lastTime     = 0;
let level        = 1;
let levelPhase   = 'transition'; // 'transition' | 'active'
let levelTimer   = 0;
let asteroidsToSpawn   = 0;
let waveSpawnTimer     = 0;
let levelSpeedMult     = 1;
let levelSpawnInterval = LEVEL_SPAWN_INTERVAL_BASE;

// ── Upgrade state ─────────────────────────────────────────────────────────────

function freshUpgrades() {
  return {
    brakes:            false,
    spreadShot:        0,     // tier: 0 | 1 | 2
    shield:            false,
    multiShot:         0,     // seconds remaining
    accelBoost:        0,     // seconds remaining
    fullStop:          0,     // uses remaining
    reactionHeld:      false,
    reactionActive:    0,     // seconds remaining when triggered
    sonicWaveHeld:     false,
    sonicWaveCooldown: 0,     // levels before sonic wave can drop again
  };
}

let upgrades   = freshUpgrades();

// ── Power-up objects ──────────────────────────────────────────────────────────

let powerUps           = [];
let sonicWaves         = [];
let pendingPowerUpType = null;
let lastDropType       = null; // prevents same temp buff dropping on consecutive levels

// ── Canvas ────────────────────────────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

// ── Debug mode (localhost only) ───────────────────────────────────────────────

const isLocalhost   = ['localhost', '127.0.0.1'].includes(window.location.hostname);
let debugOverlay    = false;
let debugInvincible = false;
let debugUsed       = false; // true if cheats were opened this session — blocks score submission

function handleDebugKey(code) {
  if (currentState !== STATE.GAMEPLAY && currentState !== STATE.PAUSED) return false;
  switch (code) {
    case 'KeyI':
      debugInvincible = !debugInvincible;
      return true;
    case 'KeyN':
      level++;
      startLevel();
      if (currentState === STATE.PAUSED) currentState = STATE.GAMEPLAY;
      return true;
    case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5':
    case 'Digit6': case 'Digit7': case 'Digit8': case 'Digit9':
      level = parseInt(code.replace('Digit', ''));
      startLevel();
      if (currentState === STATE.PAUSED) currentState = STATE.GAMEPLAY;
      return true;
    case 'KeyB': upgrades.brakes = true;                        return true;
    case 'KeyM': upgrades.multiShot = MULTISHOT_DURATION;       return true;
    case 'KeyE': if (upgrades.spreadShot < 2) upgrades.spreadShot++; return true;
    case 'KeyV': upgrades.sonicWaveHeld = true;                  return true;
    case 'KeyC': upgrades.accelBoost = ACCELBOOST_DURATION;     return true;
    case 'KeyF': upgrades.fullStop = FULLSTOP_USES;             return true;
    case 'KeyR': upgrades.reactionHeld = true;                  return true;
    case 'KeyG': upgrades.shield = true;                        return true;
    case 'KeyX': upgrades = freshUpgrades();                    return true;
    default:     return false;
  }
}

function drawDebugOverlay() {
  const pw = 310;
  const ph = 242;
  const px = SCREEN_WIDTH - pw - 10;
  const py = 10;

  ctx.fillStyle   = 'rgba(0,0,0,0.85)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = '#0f0';
  ctx.lineWidth   = 1;
  ctx.strokeRect(px, py, pw, ph);

  ctx.font      = 'bold 11px monospace';
  ctx.fillStyle = '#0f0';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('DEBUG MODE', px + 10, py + 16);

  ctx.font      = '11px monospace';
  ctx.fillStyle = debugInvincible ? '#0f0' : 'rgba(255,255,255,0.4)';
  ctx.fillText(`[I] INVINCIBLE: ${debugInvincible ? 'ON' : 'OFF'}`, px + 10, py + 32);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('[N] Next level   [1-9] Jump to level', px + 10, py + 48);

  ctx.strokeStyle = 'rgba(0,255,0,0.3)';
  ctx.beginPath();
  ctx.moveTo(px + 10, py + 58);
  ctx.lineTo(px + pw - 10, py + 58);
  ctx.stroke();

  const cmds = [
    ['B', 'Brakes'],
    ['M', 'Multi-Shot (8s)'],
    ['E', 'Spread Shot (tier up)'],
    ['V', 'Sonic Wave'],
    ['C', 'Accel Boost (8s)'],
    ['F', 'Full Stop (3 uses)'],
    ['R', 'Reaction (held)'],
    ['G', 'Shield'],
    ['X', 'Clear all upgrades'],
  ];
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('POWER-UPS', px + 10, py + 72);
  cmds.forEach(([key, label], i) => {
    ctx.fillStyle = 'rgba(0,255,0,0.8)';
    ctx.fillText(`[${key}]`, px + 10, py + 88 + i * 18);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(label, px + 42, py + 88 + i * 18);
  });
}

// ── Input ─────────────────────────────────────────────────────────────────────

const keys = {};
document.addEventListener('keydown', e => {
  if (e.target.tagName !== 'INPUT') e.preventDefault();

  if (isLocalhost && e.key === '`') {
    debugOverlay = !debugOverlay;
    if (debugOverlay) debugUsed = true;
    return;
  }
  if (isLocalhost && debugOverlay && handleDebugKey(e.code)) return;

  keys[e.code] = true;

  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (currentState === STATE.GAMEPLAY) {
      prevState    = STATE.GAMEPLAY;
      currentState = STATE.PAUSED;
    } else if (currentState === STATE.PAUSED) {
      currentState = prevState;
    }
  }

  if (currentState === STATE.GAMEPLAY) {
    if (e.code === 'Digit1' && upgrades.fullStop > 0) {
      upgrades.fullStop--;
      player.vx = 0;
      player.vy = 0;
    }
    if (e.code === 'Digit2' && upgrades.reactionHeld && upgrades.reactionActive <= 0) {
      upgrades.reactionHeld   = false;
      upgrades.reactionActive = REACTION_DURATION;
    }
    if (e.code === 'Digit3' && upgrades.sonicWaveHeld) {
      upgrades.sonicWaveHeld = false;
      applySonicWave();
    }
  }
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ── Screen management ─────────────────────────────────────────────────────────

const screens = {
  [STATE.START]:       document.getElementById('screen-start'),
  [STATE.GAMEOVER]:    document.getElementById('screen-gameover'),
  [STATE.LEADERBOARD]: document.getElementById('screen-leaderboard'),
};
const scoreDisplay = document.getElementById('score-display');
const scoreValue   = document.getElementById('score-value');
const levelValue   = document.getElementById('level-value');

function showScreen(state) {
  currentState = state;
  Object.values(screens).forEach(el => el.classList.add('hidden'));
  scoreDisplay.classList.add('hidden');

  if (state === STATE.GAMEPLAY) {
    scoreDisplay.classList.remove('hidden');
  } else if (screens[state]) {
    screens[state].classList.remove('hidden');
  }
}

// ── Loot table ────────────────────────────────────────────────────────────────

const LOOT_TABLE = [
  { type: 'accelBoost',  baseWeight: 30, minLevel: 2,
    eligible: () => upgrades.accelBoost <= 0 && lastDropType !== 'accelBoost' },
  { type: 'multiShot',   baseWeight: 25, minLevel: 2,
    eligible: () => upgrades.multiShot <= 0 && lastDropType !== 'multiShot' },
  { type: 'spreadShot1', baseWeight: 18, minLevel: 2,
    eligible: () => upgrades.spreadShot < 1 },
  { type: 'brakes',      baseWeight: 12, minLevel: 2,
    eligible: () => !upgrades.brakes },
  { type: 'spreadShot2', baseWeight:  8, minLevel: 2,
    eligible: () => upgrades.spreadShot === 1 },
  { type: 'shield',      baseWeight: 10, minLevel: 2,
    eligible: () => !upgrades.shield },
  { type: 'reaction',    baseWeight:  4, minLevel: 6,
    eligible: () => !upgrades.reactionHeld && upgrades.reactionActive <= 0,
    weightFn: () => 4 + Math.max(0, level - 6) },
  { type: 'sonicWave',   baseWeight:  2, minLevel: 5,
    eligible: () => upgrades.sonicWaveCooldown <= 0 && !upgrades.sonicWaveHeld,
    weightFn: () => 2 + Math.floor(Math.max(0, level - 5) / 2) },
  { type: 'fullStop',    baseWeight:  1, minLevel: 9,
    eligible: () => upgrades.fullStop <= 1,
    weightFn: () => 1 + Math.max(0, level - 9) * 2 },
];

function rollLoot() {
  const eligible = LOOT_TABLE.filter(e => level >= e.minLevel && e.eligible());

  if (eligible.length === 0) {
    // Fallback: re-drop the temp buff with the shortest remaining duration
    const temps = [
      { type: 'multiShot',  remaining: upgrades.multiShot },
      { type: 'accelBoost', remaining: upgrades.accelBoost },
    ].filter(t => t.remaining > 0).sort((a, b) => a.remaining - b.remaining);
    return temps.length > 0 ? temps[0].type : null;
  }

  const pool  = eligible.map(e => ({ type: e.type, weight: e.weightFn ? e.weightFn() : e.baseWeight }));
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) return e.type;
  }
  return pool[pool.length - 1].type;
}

// ── Game lifecycle ────────────────────────────────────────────────────────────

function getLevelParams(lvl) {
  const countTier    = Math.floor((lvl - 1) / 3);
  const speedTier    = Math.floor((lvl + 1) / 3);
  const intervalTier = Math.floor(lvl / 3);
  return {
    count:         LEVEL_ASTEROID_BASE + countTier * LEVEL_ASTEROID_INCREMENT,
    speedMult:     Math.pow(LEVEL_SPEED_MULTIPLIER, speedTier),
    spawnInterval: Math.max(LEVEL_SPAWN_INTERVAL_MIN,
                     LEVEL_SPAWN_INTERVAL_BASE - intervalTier * LEVEL_SPAWN_INTERVAL_DECREMENT),
  };
}

function startLevel() {
  const params       = getLevelParams(level);
  levelSpeedMult     = params.speedMult;
  levelSpawnInterval = params.spawnInterval;
  asteroidsToSpawn   = params.count;
  waveSpawnTimer     = levelSpawnInterval;
  levelPhase         = 'transition';
  levelTimer         = LEVEL_TRANSITION_DURATION;
  asteroids          = [];
  bullets            = [];
  powerUps           = [];
  sonicWaves         = [];
  pendingPowerUpType = null;
  levelValue.textContent = level;

  if (level >= 2) {
    pendingPowerUpType = rollLoot();
    lastDropType = pendingPowerUpType;
    if (upgrades.sonicWaveCooldown > 0) upgrades.sonicWaveCooldown--;
  }
}

function startGame() {
  score           = 0;
  level           = 1;
  lives           = PLAYER_LIVES;
  upgrades        = freshUpgrades();
  lastDropType    = null;
  debugInvincible = false;
  debugUsed       = false;
  scoreValue.textContent = '0';
  player   = new Player(SCREEN_WIDTH / 2, GAMEPLAY_HEIGHT / 2);
  bullets    = [];
  powerUps   = [];
  sonicWaves = [];
  pendingPowerUpType = null;
  showScreen(STATE.GAMEPLAY);
  startLevel();
}

function loseLife() {
  lives--;
  if (lives <= 0) {
    triggerGameOver();
    return;
  }
  upgrades = freshUpgrades();
  player   = new Player(SCREEN_WIDTH / 2, GAMEPLAY_HEIGHT / 2);
  player.invulnerableTimer = PLAYER_INVULNERABILITY_DURATION;
  bullets  = [];
}

function triggerGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  showScreen(STATE.GAMEOVER);
  document.getElementById('final-score').textContent = `Final score: ${score}`;

  const label  = document.querySelector('label[for="name-input"]');
  const input  = document.getElementById('name-input');
  const btn    = document.getElementById('btn-submit');

  if (debugUsed) {
    label.style.display = 'none';
    input.style.display = 'none';
    btn.textContent     = 'VIEW LEADERBOARD';
    btn.disabled        = false;
  } else {
    label.style.display = '';
    input.style.display = '';
    btn.textContent     = 'SUBMIT SCORE';
    btn.disabled        = false;
    input.value         = '';
    setTimeout(() => input.focus(), 50);
  }
}

document.getElementById('name-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitScore();
});

async function submitScore() {
  const btn = document.getElementById('btn-submit');

  if (debugUsed) {
    btn.textContent = 'LOADING…';
    btn.disabled    = true;
    try {
      const [weekly, allTime] = await Promise.all([fetchWeeklyTop3(), fetchAllTimeTop10()]);
      populateLeaderboard(weekly, allTime);
      showScreen(STATE.LEADERBOARD);
    } catch (err) {
      console.error('Leaderboard load failed:', err);
      btn.textContent = 'ERROR — TRY AGAIN';
    } finally {
      btn.disabled = false;
    }
    return;
  }

  const name = document.getElementById('name-input').value.trim();
  if (!name) return;

  btn.textContent = 'SAVING…';
  btn.disabled    = true;

  try {
    await saveScore(name, score);
    const [weekly, allTime] = await Promise.all([fetchWeeklyTop3(), fetchAllTimeTop10()]);
    populateLeaderboard(weekly, allTime);
    showScreen(STATE.LEADERBOARD);
  } catch (err) {
    console.error('Score submission failed:', err);
    btn.textContent = 'ERROR — TRY AGAIN';
  } finally {
    btn.disabled = false;
  }
}

function populateLeaderboard(weekly, allTime) {
  function renderRows(tableId, rows) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    rows.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${row.username}</td><td>${row.score}</td>`;
      tbody.appendChild(tr);
    });
  }
  renderRows('table-weekly',  weekly);
  renderRows('table-alltime', allTime);
}

// ── Button wiring ─────────────────────────────────────────────────────────────

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-submit').addEventListener('click', submitScore);
document.getElementById('btn-play-again').addEventListener('click', () => showScreen(STATE.START));

// ── Helpers ───────────────────────────────────────────────────────────────────

function rotateVec(vx, vy, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { vx: vx * cos - vy * sin, vy: vx * sin + vy * cos };
}

// ── Entities ──────────────────────────────────────────────────────────────────

let player    = null;
let bullets   = [];
let asteroids = [];

class Player {
  constructor(x, y) {
    this.x                = x;
    this.y                = y;
    this.vx               = 0;
    this.vy               = 0;
    this.rotation         = 0;
    this.shootCooldown    = 0;
    this.radius           = PLAYER_RADIUS;
    this.invulnerableTimer = 0;
  }

  update(dt) {
    const turnRad    = PLAYER_TURN_SPEED * (Math.PI / 180);
    const thrustMult = upgrades.accelBoost > 0 ? ACCELBOOST_MULTIPLIER : 1;

    if (keys['KeyA']) this.rotation -= turnRad * dt;
    if (keys['KeyD']) this.rotation += turnRad * dt;

    if (keys['KeyW']) {
      this.vx += Math.sin(this.rotation) * PLAYER_THRUST * thrustMult * dt;
      this.vy -= Math.cos(this.rotation) * PLAYER_THRUST * thrustMult * dt;
    }
    if (keys['KeyS'] && upgrades.brakes) {
      this.vx -= Math.sin(this.rotation) * PLAYER_THRUST * thrustMult * dt;
      this.vy += Math.cos(this.rotation) * PLAYER_THRUST * thrustMult * dt;
    }

    const frictionFactor = Math.pow(PLAYER_FRICTION, dt * 60);
    this.vx *= frictionFactor;
    this.vy *= frictionFactor;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > PLAYER_MAX_SPEED) {
      this.vx = (this.vx / speed) * PLAYER_MAX_SPEED;
      this.vy = (this.vy / speed) * PLAYER_MAX_SPEED;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 0)               this.x += SCREEN_WIDTH;
    if (this.x > SCREEN_WIDTH)    this.x -= SCREEN_WIDTH;
    if (this.y < 0)               this.y += GAMEPLAY_HEIGHT;
    if (this.y > GAMEPLAY_HEIGHT) this.y -= GAMEPLAY_HEIGHT;

    if (this.invulnerableTimer > 0) this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    this.shootCooldown -= dt;
    if (keys['Space']) this.shoot();
  }

  shoot() {
    if (this.shootCooldown > 0) return;
    this.shootCooldown = upgrades.multiShot > 0 ? MULTISHOT_FIRE_COOLDOWN : BULLET_COOLDOWN;
    this.fireSpread(this.rotation);
  }

  fireSpread(rotation) {
    if (upgrades.spreadShot === 0) {
      bullets.push(new Bullet(this.x, this.y, rotation));
    } else if (upgrades.spreadShot === 1) {
      for (const offset of [-15, 0, 15]) {
        bullets.push(new Bullet(this.x, this.y, rotation + offset * Math.PI / 180));
      }
    } else {
      for (const offset of [-30, -15, 0, 15, 30]) {
        bullets.push(new Bullet(this.x, this.y, rotation + offset * Math.PI / 180));
      }
    }
  }

  draw() {
    // Blink when invulnerable: skip every other 0.1s slice
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 10) % 2 === 0) return;

    const r = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.strokeStyle = '#40ffcc';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-r / 1.5, r);
    ctx.lineTo( r / 1.5, r);
    ctx.closePath();
    ctx.stroke();

    if (upgrades.shield) {
      ctx.beginPath();
      ctx.arc(0, 0, r * SHIELD_RADIUS_MULT, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(160, 100, 255, 0.8)';
      ctx.lineWidth   = 2;
      ctx.shadowColor = 'rgba(160, 100, 255, 0.5)';
      ctx.shadowBlur  = 10;
      ctx.stroke();
    }

    ctx.restore();
  }
}

class Bullet {
  constructor(x, y, rotation) {
    this.x        = x;
    this.y        = y;
    this.vx       = Math.sin(rotation) * BULLET_SPEED;
    this.vy       = -Math.cos(rotation) * BULLET_SPEED;
    this.lifetime = BULLET_LIFETIME;
    this.radius   = BULLET_RADIUS;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 0)               this.x += SCREEN_WIDTH;
    if (this.x > SCREEN_WIDTH)    this.x -= SCREEN_WIDTH;
    if (this.y < 0)               this.y += GAMEPLAY_HEIGHT;
    if (this.y > GAMEPLAY_HEIGHT) this.y -= GAMEPLAY_HEIGHT;

    this.lifetime -= dt;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffa040';
    ctx.fill();
  }

  get expired() { return this.lifetime <= 0; }
}

const ASTEROID_RADII = {
  [ASTEROID_LARGE]:  ASTEROID_LARGE_RADIUS,
  [ASTEROID_MEDIUM]: ASTEROID_MEDIUM_RADIUS,
  [ASTEROID_SMALL]:  ASTEROID_SMALL_RADIUS,
};

const ASTEROID_POINTS = {
  [ASTEROID_LARGE]:  POINTS_LARGE,
  [ASTEROID_MEDIUM]: POINTS_MEDIUM,
  [ASTEROID_SMALL]:  POINTS_SMALL,
};

class Asteroid {
  constructor(x, y, tier) {
    this.x      = x;
    this.y      = y;
    this.tier   = tier;
    this.radius = ASTEROID_RADII[tier];
    this.vx     = 0;
    this.vy     = 0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 0)               this.x += SCREEN_WIDTH;
    if (this.x > SCREEN_WIDTH)    this.x -= SCREEN_WIDTH;
    if (this.y < 0)               this.y += GAMEPLAY_HEIGHT;
    if (this.y > GAMEPLAY_HEIGHT) this.y -= GAMEPLAY_HEIGHT;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth   = 2;
    ctx.stroke();
  }

  split() {
    const childTiers = {
      [ASTEROID_LARGE]:  [ASTEROID_MEDIUM, ASTEROID_MEDIUM],
      [ASTEROID_MEDIUM]: [ASTEROID_SMALL,  ASTEROID_SMALL],
      [ASTEROID_SMALL]:  [],
    }[this.tier];

    const randAngle = 20 + Math.random() * 30;
    return childTiers.map((tier, i) => {
      const angle = i === 0 ? randAngle : -randAngle;
      const r     = rotateVec(this.vx, this.vy, angle);
      const child = new Asteroid(this.x, this.y, tier);
      child.vx    = r.vx * 1.2;
      child.vy    = r.vy * 1.2;
      return child;
    });
  }
}

// ── Sonic Wave ────────────────────────────────────────────────────────────────

class SonicWave {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.radius = 0;
    this.done   = false;
    this.hitSet = new Set();
  }

  update(dt) {
    const prev  = this.radius;
    this.radius = Math.min(this.radius + SONICWAVE_EXPAND_SPEED * dt, SONICWAVE_MAX_RADIUS);
    if (this.radius >= SONICWAVE_MAX_RADIUS) this.done = true;

    const killed  = [];
    const spawned = [];
    for (const a of asteroids) {
      if (this.hitSet.has(a)) continue;
      const dist = Math.hypot(a.x - this.x, a.y - this.y);
      if (this.radius >= dist - a.radius) {
        this.hitSet.add(a);
        killed.push(a);
        score += ASTEROID_POINTS[a.tier];
        const children = a.tier !== ASTEROID_SMALL ? a.split() : [];
        for (const child of children) {
          this.hitSet.add(child); // immune to this wave instance
          spawned.push(child);
        }
      }
    }

    if (killed.length > 0) {
      const killedSet = new Set(killed);
      asteroids = asteroids.filter(a => !killedSet.has(a)).concat(spawned);
      scoreValue.textContent = score;
    }
  }

  draw() {
    if (this.radius <= 0) return;
    const t     = this.radius / SONICWAVE_MAX_RADIUS;
    const alpha = (1 - t) * 0.85 + 0.15;
    ctx.save();
    ctx.strokeStyle = `rgba(0, 210, 255, ${alpha.toFixed(2)})`;
    ctx.lineWidth   = 3 - t;
    ctx.shadowColor = 'rgba(0, 210, 255, 0.6)';
    ctx.shadowBlur  = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Power-Ups ─────────────────────────────────────────────────────────────────

const POWERUP_LABELS = {
  brakes:      'B',
  spreadShot1: 'SS',
  spreadShot2: 'SS',
  multiShot:   'M',
  accelBoost:  'AB',
  sonicWave:   'SW',
  fullStop:    'FS',
  reaction:    'RE',
  shield:      'SH',
};

class PowerUp {
  constructor(x, y, type) {
    this.x        = x;
    this.y        = y;
    this.type     = type;
    this.label    = POWERUP_LABELS[type] || '?';
    this.lifetime = POWERUP_LIFETIME;
    this.vx       = 0;
    this.vy       = 0;
    this.radius   = POWERUP_RADIUS;
  }

  update(dt) {
    this.x        += this.vx * dt;
    this.y        += this.vy * dt;
    this.lifetime -= dt;

    if (this.x < 0)               this.x += SCREEN_WIDTH;
    if (this.x > SCREEN_WIDTH)    this.x -= SCREEN_WIDTH;
    if (this.y < 0)               this.y += GAMEPLAY_HEIGHT;
    if (this.y > GAMEPLAY_HEIGHT) this.y -= GAMEPLAY_HEIGHT;
  }

  draw() {
    const blinking = this.lifetime < POWERUP_BLINK_TIME;
    if (blinking && Math.floor(this.lifetime * 4) % 2 === 0) return;

    ctx.save();
    ctx.fillStyle   = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle    = 'white';
    ctx.font         = `bold ${this.label.length > 1 ? 10 : 13}px monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, this.x, this.y);
    ctx.restore();
  }
}

function spawnPowerUp(type) {
  const edge  = SPAWN_EDGES[Math.floor(Math.random() * SPAWN_EDGES.length)];
  const speed = POWERUP_SPEED_MIN + Math.random() * (POWERUP_SPEED_MAX - POWERUP_SPEED_MIN);
  const angle = -30 + Math.random() * 60;
  const { vx, vy } = rotateVec(edge.dir[0] * speed, edge.dir[1] * speed, angle);
  const [x, y] = edge.pos(Math.random());
  const pu = new PowerUp(x, y, type);
  pu.vx = vx;
  pu.vy = vy;
  powerUps.push(pu);
}

function applyPowerUp(type) {
  switch (type) {
    case 'brakes':      upgrades.brakes = true; break;
    case 'spreadShot1': upgrades.spreadShot = Math.max(upgrades.spreadShot, 1); break;
    case 'spreadShot2': upgrades.spreadShot = 2; break;
    case 'multiShot':   upgrades.multiShot  = MULTISHOT_DURATION; break;
    case 'accelBoost':  upgrades.accelBoost = ACCELBOOST_DURATION; break;
    case 'sonicWave':   upgrades.sonicWaveHeld = true; upgrades.sonicWaveCooldown = SONICWAVE_COOLDOWN_LEVELS; break;
    case 'fullStop':    upgrades.fullStop   = FULLSTOP_USES; break;
    case 'reaction':    upgrades.reactionHeld = true; break;
    case 'shield':      upgrades.shield = true; break;
  }
}

function applySonicWave() {
  sonicWaves.push(new SonicWave(player.x, player.y));
}

// ── Spawner ───────────────────────────────────────────────────────────────────

const SPAWN_EDGES = [
  { dir: [ 1,  0], pos: t => [-ASTEROID_LARGE_RADIUS,               t * GAMEPLAY_HEIGHT] },
  { dir: [-1,  0], pos: t => [SCREEN_WIDTH + ASTEROID_LARGE_RADIUS,  t * GAMEPLAY_HEIGHT] },
  { dir: [ 0,  1], pos: t => [t * SCREEN_WIDTH, -ASTEROID_LARGE_RADIUS] },
  { dir: [ 0, -1], pos: t => [t * SCREEN_WIDTH,  GAMEPLAY_HEIGHT + ASTEROID_LARGE_RADIUS] },
];

function spawnWaveAsteroid() {
  const edge  = SPAWN_EDGES[Math.floor(Math.random() * SPAWN_EDGES.length)];
  const base  = ASTEROID_SPAWN_SPEED_MIN + Math.random() * (ASTEROID_SPAWN_SPEED_MAX - ASTEROID_SPAWN_SPEED_MIN);
  const speed = base * levelSpeedMult;
  const angleOffset = -30 + Math.random() * 60;
  const { vx, vy } = rotateVec(edge.dir[0] * speed, edge.dir[1] * speed, angleOffset);
  const [x, y] = edge.pos(Math.random());
  const a = new Asteroid(x, y, ASTEROID_LARGE);
  a.vx = vx;
  a.vy = vy;
  asteroids.push(a);
}

// ── Update / Draw ─────────────────────────────────────────────────────────────

function circlesOverlap(ax, ay, ar, bx, by, br) {
  return Math.hypot(ax - bx, ay - by) < ar + br;
}

function checkCollisions() {
  const bulletsHit   = new Set();
  const asteroidsHit = new Set();
  const spawned      = [];

  for (const b of bullets) {
    for (const a of asteroids) {
      if (asteroidsHit.has(a)) continue;
      if (circlesOverlap(b.x, b.y, b.radius, a.x, a.y, a.radius)) {
        bulletsHit.add(b);
        asteroidsHit.add(a);
        score += ASTEROID_POINTS[a.tier];
        scoreValue.textContent = score;
        spawned.push(...a.split());
      }
    }
  }

  bullets   = bullets.filter(b => !bulletsHit.has(b));
  asteroids = asteroids.filter(a => !asteroidsHit.has(a)).concat(spawned);

  if (!debugInvincible && player.invulnerableTimer <= 0) {
    const shieldR        = player.radius * SHIELD_RADIUS_MULT;
    let   shieldConsumed = null;

    for (const a of asteroids) {
      if (upgrades.shield && circlesOverlap(player.x, player.y, shieldR, a.x, a.y, a.radius)) {
        upgrades.shield  = false;
        shieldConsumed   = a;
        score           += ASTEROID_POINTS[a.tier];
        scoreValue.textContent = score;
        break;
      }
      if (circlesOverlap(player.x, player.y, player.radius, a.x, a.y, a.radius)) {
        loseLife();
        return;
      }
    }

    if (shieldConsumed) {
      const sc = shieldConsumed;

      // Direction away from player at moment of impact
      const awayX  = sc.x - player.x;
      const awayY  = sc.y - player.y;
      const dist   = Math.hypot(awayX, awayY);
      const nx     = dist > 0 ? awayX / dist : 1;
      const ny     = dist > 0 ? awayY / dist : 0;

      const childSpeed = Math.hypot(player.vx, player.vy) * 1.25;

      // Tier map mirrors Asteroid.split()
      const childTierMap = {
        [ASTEROID_LARGE]:  [ASTEROID_MEDIUM, ASTEROID_MEDIUM],
        [ASTEROID_MEDIUM]: [ASTEROID_SMALL,  ASTEROID_SMALL],
        [ASTEROID_SMALL]:  [],
      };
      const childTiers = childTierMap[sc.tier];
      const fanAngle   = 25 * Math.PI / 180;
      const angles     = [-fanAngle, fanAngle];

      const children = childTiers.map((tier, i) => {
        const θ    = angles[i];
        const cosθ = Math.cos(θ);
        const sinθ = Math.sin(θ);
        const child = new Asteroid(sc.x, sc.y, tier);
        child.vx    = (nx * cosθ - ny * sinθ) * childSpeed;
        child.vy    = (nx * sinθ + ny * cosθ) * childSpeed;
        return child;
      });

      asteroids = asteroids.filter(a => a !== sc).concat(children);

      // Dampen player velocity to clear children from immediate path
      player.vx *= 0.25;
      player.vy *= 0.25;
    }
  }
}

function update(dt) {
  if (levelPhase === 'transition') {
    player.update(dt);
    levelTimer -= dt;
    if (levelTimer <= 0) levelPhase = 'active';
    return;
  }

  // Reaction Enhancement slows all non-player objects
  const worldDt = upgrades.reactionActive > 0 ? dt * REACTION_SLOWDOWN : dt;

  player.update(dt);

  bullets = bullets.filter(b => !b.expired);
  for (const b of bullets) b.update(worldDt);

  // Staggered wave spawning
  if (asteroidsToSpawn > 0) {
    waveSpawnTimer += dt;
    if (waveSpawnTimer >= levelSpawnInterval) {
      waveSpawnTimer = 0;
      spawnWaveAsteroid();
      asteroidsToSpawn--;
    }
  }

  // Spawn power-up once all wave asteroids have been launched
  if (asteroidsToSpawn === 0 && pendingPowerUpType !== null) {
    spawnPowerUp(pendingPowerUpType);
    pendingPowerUpType = null;
  }

  for (const a of asteroids) a.update(worldDt);
  for (const pu of powerUps) pu.update(worldDt);

  for (const sw of sonicWaves) sw.update(dt);
  sonicWaves = sonicWaves.filter(sw => !sw.done);

  // Power-up pickup
  powerUps = powerUps.filter(pu => {
    if (pu.lifetime <= 0) return false;
    if (circlesOverlap(player.x, player.y, player.radius, pu.x, pu.y, pu.radius)) {
      applyPowerUp(pu.type);
      return false;
    }
    return true;
  });

  // Upgrade timers
  if (upgrades.multiShot > 0) {
    upgrades.multiShot = Math.max(0, upgrades.multiShot - dt);
  }
  if (upgrades.accelBoost    > 0) upgrades.accelBoost    = Math.max(0, upgrades.accelBoost    - dt);
  if (upgrades.reactionActive > 0) upgrades.reactionActive = Math.max(0, upgrades.reactionActive - dt);

  checkCollisions();

  if (currentState !== STATE.GAMEPLAY) return;
  if (asteroidsToSpawn === 0 && asteroids.length === 0) {
    level++;
    startLevel();
  }
}

// ── HUD ───────────────────────────────────────────────────────────────────────

function drawShipIcon(x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(-r / 1.5, r);
  ctx.lineTo( r / 1.5, r);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  const y = GAMEPLAY_HEIGHT;
  const h = SCREEN_HEIGHT - GAMEPLAY_HEIGHT;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, y, SCREEN_WIDTH, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(SCREEN_WIDTH, y);
  ctx.stroke();

  const midY = y + h / 2;

  // Lives — ship icons
  const iconR       = 7;
  const iconSpacing = 18;
  const iconsStartX = 14;
  for (let i = 0; i < lives; i++) {
    drawShipIcon(iconsStartX + i * iconSpacing, midY, iconR, 'rgba(255,255,255,0.85)');
  }

  // Left — permanent / passive upgrades
  hudLabel(90,  midY, 'BRAKES',   upgrades.brakes);
  hudLabel(183, midY, 'SPREAD 1', upgrades.spreadShot >= 1);
  hudLabel(276, midY, 'SPREAD 2', upgrades.spreadShot >= 2);
  hudLabel(364, midY, 'SHIELD',   upgrades.shield);

  // Center — temporary buffs
  const cx = SCREEN_WIDTH / 2;
  const multiOn = upgrades.multiShot > 0;
  const boostOn = upgrades.accelBoost > 0;
  hudLabel(cx - 100, midY, multiOn ? `MULTI-SHOT ${upgrades.multiShot.toFixed(1)}s` : 'MULTI-SHOT', multiOn);
  hudLabel(cx + 100, midY, boostOn ? `ACCEL BOOST ${upgrades.accelBoost.toFixed(1)}s` : 'ACCEL BOOST', boostOn);

  // Right — activatable slots
  const fsOn  = upgrades.fullStop > 0;
  const fsLabel = fsOn ? `1 FULL STOP ×${upgrades.fullStop}` : '1 FULL STOP';
  hudLabel(SCREEN_WIDTH - 370, midY, fsLabel, fsOn);

  const reOn    = upgrades.reactionActive > 0;
  const reReady = upgrades.reactionHeld;
  const reLabel = reOn    ? `2 REACTION ${upgrades.reactionActive.toFixed(1)}s`
                : reReady ? '2 REACTION READY'
                : '2 REACTION';
  hudLabel(SCREEN_WIDTH - 195, midY, reLabel, reOn || reReady);

  const swLabel = upgrades.sonicWaveHeld ? '3 SONIC WAVE READY' : '3 SONIC WAVE';
  hudLabel(SCREEN_WIDTH - 55, midY, swLabel, upgrades.sonicWaveHeld);
}

function hudLabel(x, y, text, active) {
  ctx.save();
  ctx.font         = active ? 'bold 13px monospace' : '13px monospace';
  ctx.fillStyle    = active ? 'white' : 'rgba(255,255,255,0.22)';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ── Pause overlay ─────────────────────────────────────────────────────────────

function wrappedLines(text, maxWidth) {
  ctx.font = '13px monospace';
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawPauseOverlay() {
  const pw       = 520;
  const descX    = 210;               // description column offset from panel left
  const descMax  = pw - descX - 20;   // max description width, respecting right padding
  const lineH    = 16;                // px between wrapped lines
  const rowGap   = 12;                // px below each row before the next

  const rows = [
    ['B',  'Brakes',      'Reverse thrust (S key)'],
    ['M',  'Multi-Shot',  '6-bullet burst, 8 sec'],
    ['SS', 'Spread Shot', '3-bullet arc; Tier 2 widens to 60°, 5 bullets'],
    ['SW', 'Sonic Wave',  'Expanding wave destroys / downgrades all asteroids (key 3)'],
    ['AB', 'Accel Boost', '+50% thrust & braking, 5 sec'],
    ['FS', 'Full Stop',   'Zero velocity instantly (key 1), 3 uses'],
    ['RE', 'Reaction',    'Slows everything 50% for 5 sec (key 2)'],
    ['SH', 'Shield',      'Absorbs one direct hit, then breaks'],
  ];

  // Pre-compute wrapped lines and row heights so we can size the panel
  const rowData = rows.map(([lbl, name, desc]) => {
    const lines = wrappedLines(desc, descMax);
    return { lbl, name, lines, height: lines.length * lineH + rowGap };
  });

  const headerH   = 92;
  const bottomPad = 18;
  const ph = headerH + rowData.reduce((s, r) => s + r.height, 0) + bottomPad;
  const px = (SCREEN_WIDTH - pw) / 2;
  const py = (GAMEPLAY_HEIGHT - ph) / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, GAMEPLAY_HEIGHT);

  ctx.fillStyle   = 'rgba(0,0,0,0.82)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(px, py, pw, ph);

  ctx.fillStyle    = 'white';
  ctx.font         = 'bold 28px monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('PAUSED', SCREEN_WIDTH / 2, py + 44);

  ctx.font      = '13px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('[P] or [ESC] to resume', SCREEN_WIDTH / 2, py + 68);

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(px + 20, py + 82);
  ctx.lineTo(px + pw - 20, py + 82);
  ctx.stroke();

  ctx.textAlign = 'left';
  let ry = py + headerH;
  for (const { lbl, name, lines, height } of rowData) {
    ctx.font      = 'bold 13px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(lbl,  px + 24, ry);
    ctx.fillStyle = 'white';
    ctx.fillText(name, px + 72, ry);

    ctx.font      = '13px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    lines.forEach((l, i) => ctx.fillText(l, px + descX, ry + i * lineH));

    ry += height;
  }
}

// ── Draw ──────────────────────────────────────────────────────────────────────

function draw() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, SCREEN_WIDTH, GAMEPLAY_HEIGHT);

  player.draw();
  for (const b of bullets)   b.draw();
  for (const a of asteroids) a.draw();
  for (const pu of powerUps) pu.draw();
  for (const sw of sonicWaves) sw.draw();

  if (levelPhase === 'transition') {
    ctx.save();
    ctx.fillStyle    = 'white';
    ctx.font         = 'bold 48px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`LEVEL ${level}`, SCREEN_WIDTH / 2, GAMEPLAY_HEIGHT * 0.2);
    ctx.restore();
  }

  drawHUD();

  if (currentState === STATE.PAUSED) drawPauseOverlay();
}

// ── Game loop ─────────────────────────────────────────────────────────────────

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (currentState === STATE.GAMEPLAY) {
    update(dt);
    if (currentState === STATE.GAMEPLAY) draw();
  } else if (currentState === STATE.PAUSED) {
    draw();
  }

  if (isLocalhost && debugOverlay) drawDebugOverlay();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
