import * as THREE from "three";
import { PLAYER_CONFIG, WORLD_CONFIG } from "../config";
import type { Input } from "../input";
import type { PhysicsSystem } from "../systems/PhysicsSystem";

export class PlayerController {
  readonly position = new THREE.Vector3(WORLD_CONFIG.START.x, WORLD_CONFIG.START.y, WORLD_CONFIG.START.z);
  readonly velocity = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  grounded = true;
  moving = false;
  private verticalVelocity = 0;
  private bobPhase = 0;

  constructor(private camera: THREE.PerspectiveCamera, private input: Input, private physics: PhysicsSystem) {
    this.camera.rotation.order = "YXZ";
    this.reset();
  }

  reset(): void {
    this.position.set(WORLD_CONFIG.START.x, WORLD_CONFIG.START.y, WORLD_CONFIG.START.z);
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.bobPhase = 0;
    this.syncCamera(0);
  }

  update(dt: number, allowJump = true): void {
    const look = this.input.consumeLook();
    this.yaw += look.yaw;
    this.pitch = THREE.MathUtils.clamp(this.pitch + look.pitch, -PLAYER_CONFIG.MAX_PITCH, PLAYER_CONFIG.MAX_PITCH);

    const length = Math.hypot(this.input.moveX, this.input.moveZ) || 1;
    const moveX = this.input.moveX / length;
    const moveZ = this.input.moveZ / length;
    const speed = this.input.isDown("ShiftLeft") || this.input.isDown("ShiftRight") ? PLAYER_CONFIG.FAST_SPEED : PLAYER_CONFIG.WALK_SPEED;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const targetX = (moveX * cos - moveZ * sin) * speed;
    const targetZ = (-moveX * sin - moveZ * cos) * speed;
    const blend = 1 - Math.exp(-PLAYER_CONFIG.ACCELERATION * dt);
    this.velocity.x += (targetX - this.velocity.x) * blend;
    this.velocity.z += (targetZ - this.velocity.z) * blend;
    this.physics.move(this.position, this.velocity.x * dt, this.velocity.z * dt, PLAYER_CONFIG.RADIUS);

    if (allowJump && this.grounded && this.input.consumeAction("Space")) {
      this.verticalVelocity = PLAYER_CONFIG.JUMP_SPEED;
      this.grounded = false;
    }
    if (!this.grounded) {
      this.verticalVelocity -= PLAYER_CONFIG.GRAVITY * dt;
      this.position.y += this.verticalVelocity * dt;
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.verticalVelocity = 0;
        this.grounded = true;
      }
    }
    this.moving = Math.hypot(this.velocity.x, this.velocity.z) > 0.35 && this.grounded;
    if (this.moving) this.bobPhase += dt * (speed > PLAYER_CONFIG.WALK_SPEED ? 10.5 : 8.2);
    this.syncCamera(dt);
  }

  private syncCamera(_dt: number): void {
    const bob = this.moving ? Math.sin(this.bobPhase) * 0.026 : 0;
    const sway = this.moving ? Math.cos(this.bobPhase * 0.5) * 0.003 : 0;
    this.camera.position.set(this.position.x, this.position.y + PLAYER_CONFIG.EYE_HEIGHT + bob, this.position.z);
    this.camera.rotation.set(this.pitch, this.yaw, sway, "YXZ");
  }
}
