// Screen
const SCREEN_WIDTH  = 1280;
const SCREEN_HEIGHT = 720;
const GAMEPLAY_HEIGHT = 670;   // bottom 50px reserved for HUD

// Player
const PLAYER_RADIUS                = 20;
const PLAYER_TURN_SPEED            = 300;   // degrees per second
const PLAYER_THRUST                = 200;   // pixels per second squared
const PLAYER_FRICTION              = 1;     // velocity multiplier per frame (1 = no friction)
const PLAYER_MAX_SPEED             = 400;   // pixels per second
const PLAYER_LIVES                 = 3;
const PLAYER_INVULNERABILITY_DURATION = 2;  // seconds after respawn

// Bullets
const BULLET_SPEED    = 500;   // pixels per second
const BULLET_RADIUS   = 4;
const BULLET_LIFETIME = 1.2;   // seconds before bullet disappears
const BULLET_COOLDOWN = 0.3;   // seconds between shots

// Asteroids
const ASTEROID_LARGE_RADIUS  = 60;
const ASTEROID_MEDIUM_RADIUS = 30;
const ASTEROID_SMALL_RADIUS  = 15;
const ASTEROID_LARGE_SPEED   = 80;
const ASTEROID_MEDIUM_SPEED  = 130;
const ASTEROID_SMALL_SPEED   = 200;
const ASTEROID_SPLIT_COUNT   = 2;
const ASTEROID_SPAWN_SPEED_MIN = 40;
const ASTEROID_SPAWN_SPEED_MAX = 100;

// Asteroid size tiers
const ASTEROID_LARGE  = 'large';
const ASTEROID_MEDIUM = 'medium';
const ASTEROID_SMALL  = 'small';

// Points
const POINTS_LARGE  = 20;
const POINTS_MEDIUM = 50;
const POINTS_SMALL  = 100;

// Level progression
const LEVEL_ASTEROID_BASE            = 3;
const LEVEL_ASTEROID_INCREMENT       = 1;
const LEVEL_SPEED_MULTIPLIER         = 1.2;
const LEVEL_SPAWN_INTERVAL_BASE      = 1.5;
const LEVEL_SPAWN_INTERVAL_DECREMENT = 0.3;
const LEVEL_SPAWN_INTERVAL_MIN       = 0.3;
const LEVEL_TRANSITION_DURATION      = 2;

// Power-ups — object
const POWERUP_RADIUS     = 16;
const POWERUP_LIFETIME   = 10;   // seconds visible before despawn
const POWERUP_BLINK_TIME = 4;    // seconds remaining when blinking starts
const POWERUP_SPEED_MIN  = 60;
const POWERUP_SPEED_MAX  = 120;

// Power-ups — Multi-Shot
const MULTISHOT_DURATION      = 5;
const MULTISHOT_FIRE_COOLDOWN = 0.05;  // seconds between shots while active (vs BULLET_COOLDOWN 0.3)

// Power-ups — Accel/Decel Boost
const ACCELBOOST_DURATION    = 8;
const ACCELBOOST_MULTIPLIER  = 1.5;

// Power-ups — Full Stop
const FULLSTOP_USES = 3;

// Power-ups — Shield
const SHIELD_RADIUS_MULT = 1.5;   // shield visual and hitbox — 50% larger than player

// Power-ups — Reaction Enhancement
const REACTION_DURATION = 5;
const REACTION_SLOWDOWN = 0.5;  // world speed multiplier when active

// Power-ups — Sonic Wave
const SONICWAVE_COOLDOWN_LEVELS = 3;    // levels before eligible again after pickup
const SONICWAVE_MAX_RADIUS      = 400;  // px — 20× player ship radius
const SONICWAVE_EXPAND_SPEED    = 280;  // px/sec
