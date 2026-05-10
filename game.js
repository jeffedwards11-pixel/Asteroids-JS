// ── State ────────────────────────────────────────────────────────────────────

const STATE = {
  START:       'start',
  GAMEPLAY:    'gameplay',
  GAMEOVER:    'gameover',
  LEADERBOARD: 'leaderboard',
};

let currentState = STATE.START;
let score = 0;
let lastTime = 0;

// ── Canvas ────────────────────────────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width  = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

// ── Input ─────────────────────────────────────────────────────────────────────

const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.target.tagName !== 'INPUT') e.preventDefault();
});
document.addEventListener('keyup',   e => { keys[e.code] = false; });

// ── Screen management ─────────────────────────────────────────────────────────

const screens = {
  [STATE.START]:       document.getElementById('screen-start'),
  [STATE.GAMEOVER]:    document.getElementById('screen-gameover'),
  [STATE.LEADERBOARD]: document.getElementById('screen-leaderboard'),
};
const scoreDisplay = document.getElementById('score-display');
const scoreValue   = document.getElementById('score-value');

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

// ── Game lifecycle ────────────────────────────────────────────────────────────

function startGame() {
  score = 0;
  scoreValue.textContent = '0';
  player     = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
  bullets    = [];
  asteroids  = [];
  spawnTimer = 0;
  showScreen(STATE.GAMEPLAY);
}

function triggerGameOver() {
  showScreen(STATE.GAMEOVER);
  document.getElementById('final-score').textContent = `Final score: ${score}`;
  document.getElementById('btn-submit').textContent = 'SUBMIT SCORE';
  const input = document.getElementById('name-input');
  input.value = '';
  setTimeout(() => input.focus(), 50);
}

document.getElementById('name-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitScore();
});

async function submitScore() {
  const name = document.getElementById('name-input').value.trim();
  if (!name) return;

  const btn = document.getElementById('btn-submit');
  btn.textContent = 'SAVING…';
  btn.disabled = true;

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
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0; // radians, 0 = nose pointing up
    this.shootCooldown = 0;
    this.radius = PLAYER_RADIUS;
  }

  update(dt) {
    const turnRad = PLAYER_TURN_SPEED * (Math.PI / 180);

    if (keys['KeyA']) this.rotation -= turnRad * dt;
    if (keys['KeyD']) this.rotation += turnRad * dt;

    if (keys['KeyW']) {
      this.vx += Math.sin(this.rotation) * PLAYER_THRUST * dt;
      this.vy -= Math.cos(this.rotation) * PLAYER_THRUST * dt;
    }

    // frame-rate independent friction (PLAYER_FRICTION is per-frame at 60fps)
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

    // screen wrap
    if (this.x < 0) this.x += SCREEN_WIDTH;
    if (this.x > SCREEN_WIDTH)  this.x -= SCREEN_WIDTH;
    if (this.y < 0) this.y += SCREEN_HEIGHT;
    if (this.y > SCREEN_HEIGHT) this.y -= SCREEN_HEIGHT;

    this.shootCooldown -= dt;
    if (keys['Space']) this.shoot();
  }

  shoot() {
    if (this.shootCooldown > 0) return;
    bullets.push(new Bullet(this.x, this.y, this.rotation));
    this.shootCooldown = BULLET_COOLDOWN;
  }

  draw() {
    const r = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r);        // nose
    ctx.lineTo(-r / 1.5, r); // left wing
    ctx.lineTo( r / 1.5, r); // right wing
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

class Bullet {
  constructor(x, y, rotation) {
    this.x = x;
    this.y = y;
    this.vx = Math.sin(rotation) * BULLET_SPEED;
    this.vy = -Math.cos(rotation) * BULLET_SPEED;
    this.lifetime = BULLET_LIFETIME;
    this.radius = BULLET_RADIUS;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 0) this.x += SCREEN_WIDTH;
    if (this.x > SCREEN_WIDTH)  this.x -= SCREEN_WIDTH;
    if (this.y < 0) this.y += SCREEN_HEIGHT;
    if (this.y > SCREEN_HEIGHT) this.y -= SCREEN_HEIGHT;

    this.lifetime -= dt;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
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
    this.x = x;
    this.y = y;
    this.tier   = tier;
    this.radius = ASTEROID_RADII[tier];
    this.vx = 0;
    this.vy = 0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Returns child asteroids to add; caller removes this one
  split() {
    const childTiers = {
      [ASTEROID_LARGE]:  [ASTEROID_MEDIUM, ASTEROID_MEDIUM],
      [ASTEROID_MEDIUM]: [ASTEROID_SMALL,  ASTEROID_SMALL],
      [ASTEROID_SMALL]:  [],
    }[this.tier];

    const randAngle = 20 + Math.random() * 30; // 20–50°, matching Python
    return childTiers.map((tier, i) => {
      const angle = i === 0 ? randAngle : -randAngle;
      const r = rotateVec(this.vx, this.vy, angle);
      const child = new Asteroid(this.x, this.y, tier);
      child.vx = r.vx * 1.2;
      child.vy = r.vy * 1.2;
      return child;
    });
  }

  isOffScreen() {
    const m = this.radius * 2;
    return this.x < -m || this.x > SCREEN_WIDTH + m ||
           this.y < -m || this.y > SCREEN_HEIGHT + m;
  }
}

// ── Spawner ───────────────────────────────────────────────────────────────────

let spawnTimer = 0;

const SPAWN_EDGES = [
  { dir: [ 1,  0], pos: t => [-ASTEROID_LARGE_RADIUS,              t * SCREEN_HEIGHT] },
  { dir: [-1,  0], pos: t => [SCREEN_WIDTH + ASTEROID_LARGE_RADIUS, t * SCREEN_HEIGHT] },
  { dir: [ 0,  1], pos: t => [t * SCREEN_WIDTH, -ASTEROID_LARGE_RADIUS] },
  { dir: [ 0, -1], pos: t => [t * SCREEN_WIDTH,  SCREEN_HEIGHT + ASTEROID_LARGE_RADIUS] },
];

const SPAWN_TIERS = [ASTEROID_LARGE, ASTEROID_MEDIUM, ASTEROID_SMALL];

function spawnAsteroid() {
  const edge  = SPAWN_EDGES[Math.floor(Math.random() * SPAWN_EDGES.length)];
  const speed = ASTEROID_SPAWN_SPEED_MIN + Math.random() * (ASTEROID_SPAWN_SPEED_MAX - ASTEROID_SPAWN_SPEED_MIN);
  const angleOffset = -30 + Math.random() * 60; // ±30°
  const { vx, vy } = rotateVec(edge.dir[0] * speed, edge.dir[1] * speed, angleOffset);

  const [x, y] = edge.pos(Math.random());
  const tier = SPAWN_TIERS[Math.floor(Math.random() * SPAWN_TIERS.length)];

  const a = new Asteroid(x, y, tier);
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

  for (const a of asteroids) {
    if (circlesOverlap(player.x, player.y, player.radius, a.x, a.y, a.radius)) {
      triggerGameOver();
      return;
    }
  }
}

function update(dt) {
  player.update(dt);

  bullets = bullets.filter(b => !b.expired);
  for (const b of bullets) b.update(dt);

  spawnTimer += dt;
  if (spawnTimer >= ASTEROID_SPAWN_RATE) {
    spawnTimer = 0;
    spawnAsteroid();
  }

  asteroids = asteroids.filter(a => !a.isOffScreen());
  for (const a of asteroids) a.update(dt);

  checkCollisions();
}

function draw() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();
  for (const b of bullets) b.draw();
  for (const a of asteroids) a.draw();
}

// ── Game loop ─────────────────────────────────────────────────────────────────

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (currentState === STATE.GAMEPLAY) {
    update(dt);
    draw();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
