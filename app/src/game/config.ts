export const INPUT_CONFIG = {
  MOUSE_SENS_X: 0.0021,
  MOUSE_SENS_Y: 0.0019,
  INVERT_X: false,
  INVERT_Y: false,
} as const;

export const PLAYER_CONFIG = {
  EYE_HEIGHT: 1.7,
  RADIUS: 0.34,
  WALK_SPEED: 3.15,
  FAST_SPEED: 4.65,
  ACCELERATION: 13,
  JUMP_SPEED: 4.4,
  GRAVITY: 13.5,
  MAX_PITCH: Math.PI * 0.47,
} as const;

export const WORLD_CONFIG = {
  SIZE: 180,
  PLAYABLE_HALF_SIZE: 76,
  GRAVEL_Y: 0.012,
  START: { x: 0, y: 0, z: 28.7 },
} as const;

export const QUALITY = {
  MAX_DPR: 1.75,
  FALLING_LEAVES: 150,
  GROUND_LEAVES: 620,
  GRASS_TUFTS: 420,
  DEGRADE_FPS: 42,
} as const;

export const PALETTE = {
  sand: 0xd5b58a,
  brick: 0xa96650,
  green: 0x72846a,
  blue: 0x8da8b1,
  concrete: 0xa9a59b,
  sunlight: 0xf3be76,
  pine: 0x344b43,
  window: 0xffd08a,
  rust: 0x81513d,
  darkMetal: 0x3d4644,
  cream: 0xe5d7b9,
} as const;
