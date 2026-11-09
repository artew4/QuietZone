import * as THREE from "three";
import { QUALITY } from "../config";
import { mulberry32, range } from "../utils/random";

export class EnvironmentSystem {
  private positions: Float32Array;
  private speeds: Float32Array;
  private geometry: THREE.BufferGeometry;
  private random = mulberry32(5150);
  private baseRotations: Array<{ object: THREE.Object3D; x: number; z: number }>;

  constructor(parent: THREE.Group, private swaying: THREE.Object3D[], private swing: THREE.Object3D, private indicator: THREE.MeshStandardMaterial) {
    this.baseRotations = swaying.map((object) => ({ object, x: object.rotation.x, z: object.rotation.z }));
    this.positions = new Float32Array(QUALITY.FALLING_LEAVES * 3);
    this.speeds = new Float32Array(QUALITY.FALLING_LEAVES);
    for (let i = 0; i < QUALITY.FALLING_LEAVES; i++) this.resetLeaf(i, true);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#d7a14c";
    ctx.beginPath(); ctx.ellipse(16, 16, 5, 11, 0.55, 0, Math.PI * 2); ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.PointsMaterial({ size: 0.14, map: texture, transparent: true, alphaTest: 0.25, depthWrite: false, color: 0xd7ae65 });
    const points = new THREE.Points(this.geometry, material);
    points.frustumCulled = false;
    points.userData.dynamic = true;
    parent.add(points);
  }

  private resetLeaf(i: number, initial = false): void {
    this.positions[i * 3] = range(this.random, -48, 48);
    this.positions[i * 3 + 1] = initial ? range(this.random, 0.3, 11) : range(this.random, 7, 12);
    this.positions[i * 3 + 2] = range(this.random, -45, 43);
    this.speeds[i] = range(this.random, 0.18, 0.48);
  }

  update(time: number, dt: number): void {
    for (const base of this.baseRotations) {
      base.object.rotation.z = base.z + Math.sin(time * 0.55 + base.object.id) * 0.012;
      base.object.rotation.x = base.x + Math.cos(time * 0.43 + base.object.id) * 0.006;
    }
    this.swing.rotation.x = Math.sin(time * 0.72) * 0.055;
    this.indicator.emissiveIntensity = Math.sin(time * 7.3) > 0.82 ? 0.15 : 1.5 + Math.sin(time * 1.7) * 0.25;
    for (let i = 0; i < QUALITY.FALLING_LEAVES; i++) {
      this.positions[i * 3 + 1] -= this.speeds[i] * dt;
      this.positions[i * 3] += Math.sin(time * 0.7 + i) * dt * 0.12;
      this.positions[i * 3 + 2] += Math.cos(time * 0.45 + i * 0.7) * dt * 0.045;
      if (this.positions[i * 3 + 1] < 0.08) this.resetLeaf(i);
    }
    this.geometry.attributes.position.needsUpdate = true;
  }
}
