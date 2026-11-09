import * as THREE from "three";

export type GameState = "title" | "playing" | "paused" | "summary";

export interface Vec3 { x: number; y: number; z: number }

export interface BoxCollider {
  kind: "box";
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  enabled: boolean;
  stamp: number;
}

export interface CircleCollider {
  kind: "circle";
  x: number;
  z: number;
  radius: number;
  minY: number;
  maxY: number;
  enabled: boolean;
  stamp: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export type Collider = BoxCollider | CircleCollider;

export interface Interactable {
  id: string;
  position: THREE.Vector3;
  radius: number;
  prompt: () => string;
  enabled: () => boolean;
  interact: () => void;
}

export interface WorldAnimation {
  update: (time: number, dt: number) => void;
}

export interface GameMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  quality: "high" | "balanced";
  renderer: string;
}

export interface GameSnapshot {
  state: GameState;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  interaction: string;
  location: string;
  garageOpen: boolean;
  oscilloscopeOn: boolean;
  radioOn: boolean;
  lampOn: boolean;
  metrics: GameMetrics;
}
