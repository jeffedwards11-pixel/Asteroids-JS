// Screen
const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;

// Player
const PLAYER_RADIUS = 20;
const PLAYER_TURN_SPEED = 300;   // degrees per second
const PLAYER_THRUST = 200;       // pixels per second squared
const PLAYER_FRICTION = 1;       // velocity multiplier per frame (1 = no friction)
const PLAYER_MAX_SPEED = 400;    // pixels per second

// Bullets
const BULLET_SPEED = 500;        // pixels per second
const BULLET_RADIUS = 4;
const BULLET_LIFETIME = 1.2;     // seconds before bullet disappears
const BULLET_COOLDOWN = 0.3;     // seconds between shots

// Asteroids
const ASTEROID_LARGE_RADIUS = 60;
const ASTEROID_MEDIUM_RADIUS = 30;
const ASTEROID_SMALL_RADIUS = 15;
const ASTEROID_LARGE_SPEED = 80;
const ASTEROID_MEDIUM_SPEED = 130;
const ASTEROID_SMALL_SPEED = 200;
// Level progression
const LEVEL_ASTEROID_BASE            = 3;
const LEVEL_ASTEROID_INCREMENT       = 1;
const LEVEL_SPEED_MULTIPLIER         = 1.2;
const LEVEL_SPAWN_INTERVAL_BASE      = 1.5;  // seconds between staggered wave spawns
const LEVEL_SPAWN_INTERVAL_DECREMENT = 0.3;
const LEVEL_SPAWN_INTERVAL_MIN       = 0.3;
const LEVEL_TRANSITION_DURATION      = 2;    // seconds to show level banner
const ASTEROID_SPLIT_COUNT = 2;  // children per split
const ASTEROID_SPAWN_SPEED_MIN = 40;
const ASTEROID_SPAWN_SPEED_MAX = 100;

// Points
const POINTS_LARGE = 20;
const POINTS_MEDIUM = 50;
const POINTS_SMALL = 100;

// Asteroid size tiers (used to determine split behavior)
const ASTEROID_LARGE = "large";
const ASTEROID_MEDIUM = "medium";
const ASTEROID_SMALL = "small";
