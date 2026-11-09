import * as THREE from "three";
import type { MaterialLibrary } from "../../utils/materials";
import { cable, meshBox, meshCylinder, plane, rodBetween } from "../../utils/geometry";
import { labelTexture } from "../../utils/materials";
import type { PhysicsSystem } from "../../systems/PhysicsSystem";

export function createBench(parent: THREE.Group, m: MaterialLibrary, physics: PhysicsSystem, x: number, z: number, rotation = 0): void {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  parent.add(group);
  for (let i = 0; i < 4; i++) meshBox(group, [2.15, 0.09, 0.17], [0, 0.55, -0.27 + i * 0.18], m.woodLight, 0.025);
  for (let i = 0; i < 3; i++) {
    const slat = meshBox(group, [2.15, 0.13, 0.09], [0, 0.87 + i * 0.18, -0.4], m.woodLight, 0.025);
    slat.rotation.x = -0.08;
  }
  for (const xLeg of [-0.8, 0.8]) {
    meshBox(group, [0.09, 0.58, 0.09], [xLeg, 0.28, -0.25], m.dark);
    meshBox(group, [0.09, 0.58, 0.09], [xLeg, 0.28, 0.25], m.dark);
    rodBetween(group, new THREE.Vector3(xLeg, 0.5, -0.38), new THREE.Vector3(xLeg, 1.28, -0.46), 0.04, m.dark);
  }
  if (Math.abs(rotation) < 0.01) physics.addBox(x, z, 2.2, 0.85, 1.25);
}

export function createStreetLamp(parent: THREE.Group, m: MaterialLibrary, x: number, z: number, rotation = 0): void {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  parent.add(group);
  meshCylinder(group, [0.075, 0.13], 4.8, [0, 2.4, 0], m.dark, 10);
  meshCylinder(group, [0.23, 0.3], 0.35, [0, 0.18, 0], m.concrete, 10);
  cable(group, [new THREE.Vector3(0, 4.65, 0), new THREE.Vector3(0.25, 5.0, 0), new THREE.Vector3(0.85, 4.85, 0)], 0.055, m.dark);
  meshBox(group, [0.7, 0.13, 0.48], [0.88, 4.77, 0], m.greenPaint, 0.06);
  const bulb = meshBox(group, [0.52, 0.08, 0.34], [0.88, 4.68, 0], m.lamp, 0.04);
  bulb.castShadow = false;
}

export function createFence(parent: THREE.Group, m: MaterialLibrary, physics: PhysicsSystem, x: number, z: number, length: number, alongX = true, wooden = false, registerCollision = true): void {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  if (!alongX) group.rotation.y = Math.PI / 2;
  parent.add(group);
  const material = wooden ? m.wood : m.greenPaint;
  const count = Math.ceil(length / 1.8);
  for (let i = 0; i <= count; i++) {
    meshBox(group, [0.12, 1.35, 0.12], [-length / 2 + (length / count) * i, 0.68, 0], material);
  }
  meshBox(group, [length, 0.09, 0.09], [0, 0.43, 0], material);
  meshBox(group, [length, 0.09, 0.09], [0, 1.06, 0], material);
  if (wooden) {
    for (let i = 0; i < Math.floor(length / 0.35); i++) {
      meshBox(group, [0.24, 0.82 + (i % 3) * 0.06, 0.045], [-length / 2 + 0.2 + i * 0.35, 0.63, 0.05], m.woodLight);
    }
  }
  if (registerCollision) physics.addBox(x, z, alongX ? length : 0.16, alongX ? 0.16 : length, 1.4);
}

export function createBarrel(parent: THREE.Group, m: MaterialLibrary, x: number, z: number, color: THREE.Material = m.rust): void {
  const barrel = meshCylinder(parent, [0.34, 0.34], 0.92, [x, 0.46, z], color, 14);
  for (const y of [0.12, 0.46, 0.82]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.025, 5, 16), m.dark);
    ring.position.set(x, y, z);
    ring.rotation.x = Math.PI / 2;
    parent.add(ring);
  }
  barrel.castShadow = true;
}

export function createTire(parent: THREE.Group, m: MaterialLibrary, x: number, y: number, z: number, upright = false): void {
  const tire = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.12, 7, 14), m.black);
  tire.position.set(x, y + (upright ? 0.36 : 0.1), z);
  tire.rotation.x = upright ? 0 : Math.PI / 2;
  tire.rotation.y = upright ? 0.25 : 0;
  tire.castShadow = true;
  parent.add(tire);
}

export function createPallet(parent: THREE.Group, m: MaterialLibrary, x: number, z: number, rotation = 0): void {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  parent.add(group);
  for (let i = 0; i < 6; i++) meshBox(group, [1.25, 0.07, 0.14], [0, 0.22, -0.45 + i * 0.18], m.woodLight);
  for (const px of [-0.45, 0, 0.45]) meshBox(group, [0.13, 0.18, 1.05], [px, 0.1, 0], m.wood);
}

export function createBicycle(parent: THREE.Group, m: MaterialLibrary, x: number, z: number, rotation = 0): void {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  parent.add(group);
  for (const wx of [-0.62, 0.62]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.035, 6, 20), m.black);
    wheel.position.set(wx, 0.39, 0);
    wheel.castShadow = true;
    group.add(wheel);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      rodBetween(group, new THREE.Vector3(wx, 0.39, 0), new THREE.Vector3(wx + Math.cos(a) * 0.33, 0.39 + Math.sin(a) * 0.33, 0), 0.006, m.metal, 4);
    }
  }
  const points = [
    [new THREE.Vector3(-0.62, 0.39, 0), new THREE.Vector3(-0.12, 0.92, 0)],
    [new THREE.Vector3(-0.12, 0.92, 0), new THREE.Vector3(0.22, 0.4, 0)],
    [new THREE.Vector3(0.22, 0.4, 0), new THREE.Vector3(-0.62, 0.39, 0)],
    [new THREE.Vector3(-0.12, 0.92, 0), new THREE.Vector3(0.52, 0.92, 0)],
    [new THREE.Vector3(0.52, 0.92, 0), new THREE.Vector3(0.22, 0.4, 0)],
    [new THREE.Vector3(0.52, 0.92, 0), new THREE.Vector3(0.62, 0.39, 0)],
  ] as const;
  points.forEach(([a, b]) => rodBetween(group, a, b, 0.025, m.redPaint, 7));
  rodBetween(group, new THREE.Vector3(-0.12, 0.92, 0), new THREE.Vector3(-0.18, 1.15, 0), 0.025, m.metal);
  meshBox(group, [0.34, 0.07, 0.18], [-0.2, 1.16, 0], m.black, 0.03);
  rodBetween(group, new THREE.Vector3(0.52, 0.92, 0), new THREE.Vector3(0.48, 1.25, 0), 0.025, m.metal);
  rodBetween(group, new THREE.Vector3(0.48, 1.25, -0.23), new THREE.Vector3(0.48, 1.25, 0.23), 0.025, m.metal);
  group.rotation.z = -0.08;
}

export function createPlayground(parent: THREE.Group, m: MaterialLibrary, physics: PhysicsSystem, x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  parent.add(group);
  // Sandbox with irregularly stacked timber and a forgotten bucket.
  meshBox(group, [4.3, 0.14, 3.4], [0, 0.07, 0], m.sand);
  for (const pz of [-1.75, 1.75]) meshBox(group, [4.65, 0.28, 0.18], [0, 0.16, pz], m.woodLight, 0.035);
  for (const px of [-2.25, 2.25]) meshBox(group, [0.18, 0.28, 3.35], [px, 0.16, 0], m.woodLight, 0.035);
  meshCylinder(group, [0.17, 0.13], 0.28, [0.8, 0.22, 0.25], m.bluePaint, 12);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.015, 5, 12, Math.PI), m.metal);
  handle.position.set(0.8, 0.38, 0.25);
  group.add(handle);

  const swing = new THREE.Group();
  swing.position.set(-4.2, 0, 0.2);
  group.add(swing);
  for (const sx of [-1.25, 1.25]) {
    rodBetween(swing, new THREE.Vector3(sx, 0, -0.8), new THREE.Vector3(sx, 2.8, 0), 0.065, m.greenPaint);
    rodBetween(swing, new THREE.Vector3(sx, 0, 0.8), new THREE.Vector3(sx, 2.8, 0), 0.065, m.greenPaint);
  }
  rodBetween(swing, new THREE.Vector3(-1.4, 2.8, 0), new THREE.Vector3(1.4, 2.8, 0), 0.075, m.greenPaint);
  const seat = new THREE.Group();
  seat.userData.dynamic = true;
  seat.position.set(0, 2.72, 0);
  swing.add(seat);
  for (const cx of [-0.48, 0.48]) rodBetween(seat, new THREE.Vector3(cx, 0, 0), new THREE.Vector3(cx, -1.75, 0), 0.016, m.dark, 5);
  meshBox(seat, [1.15, 0.09, 0.42], [0, -1.78, 0], m.woodLight, 0.025);

  // Small slide and climbing ladder.
  const slide = new THREE.Group();
  slide.position.set(4.4, 0, 0.4);
  group.add(slide);
  meshBox(slide, [1.2, 0.12, 1.1], [0, 1.35, -0.8], m.wood);
  const chute = meshBox(slide, [0.85, 0.09, 2.8], [0, 0.8, 0.55], m.bluePaint);
  chute.rotation.x = -0.48;
  for (const sx of [-0.52, 0.52]) {
    rodBetween(slide, new THREE.Vector3(sx, 0, -1.5), new THREE.Vector3(sx, 1.5, -1.1), 0.035, m.metal);
  }
  for (let i = 0; i < 5; i++) rodBetween(slide, new THREE.Vector3(-0.52, 0.25 + i * 0.27, -1.43 + i * 0.07), new THREE.Vector3(0.52, 0.25 + i * 0.27, -1.43 + i * 0.07), 0.028, m.metal);
  physics.addBox(x - 4.2, z + 0.2, 3.1, 1.8, 2.9);
  physics.addBox(x, z, 4.6, 3.6, 0.3);
  return seat;
}

export function createCourtyardProps(parent: THREE.Group, m: MaterialLibrary, physics: PhysicsSystem): void {
  createBench(parent, m, physics, -7, -4, Math.PI * 0.08);
  createBench(parent, m, physics, 7, -8, -Math.PI * 0.45);
  createBench(parent, m, physics, -18, -25, Math.PI * 0.5);
  createBench(parent, m, physics, 17, -26, -Math.PI * 0.5);
  [[-11, 13], [13, 11], [-18, -6], [18, -13], [-6, -30], [28, 30]].forEach(([x, z], i) => createStreetLamp(parent, m, x, z, i % 2 ? Math.PI : 0));

  // Trash containers and a small notice board near the entrance.
  for (let i = 0; i < 3; i++) {
    meshBox(parent, [1.05, 1.15, 0.85], [-32 + i * 1.15, 0.62, 4], i === 1 ? m.greenPaint : m.metal, 0.07);
    const lid = meshBox(parent, [1.12, 0.1, 0.92], [-32 + i * 1.15, 1.22, 4], m.dark);
    lid.rotation.x = i === 2 ? -0.16 : 0;
  }
  physics.addBox(-30.85, 4, 3.5, 1, 1.3);
  meshBox(parent, [2.3, 1.45, 0.12], [-19, 1.7, 10], m.wood);
  for (const px of [-19.9, -18.1]) meshBox(parent, [0.1, 2.2, 0.1], [px, 1.1, 10], m.dark);
  const notice = new THREE.MeshStandardMaterial({ map: labelTexture("ОБЪЯВЛЕНИЯ", "#d3c69f", "#655b48", "СОБРАНИЕ ЖИЛЬЦОВ · ПЯТНИЦА"), roughness: 1 });
  plane(parent, 2.05, 1.2, [-19, 1.72, 10.07], notice);

  // Elevated heating main with weathered insulation.
  for (let i = 0; i < 5; i++) {
    meshBox(parent, [0.28, 0.65, 0.28], [-42 + i * 4, 0.33, 15], m.concrete);
  }
  rodBetween(parent, new THREE.Vector3(-43, 0.85, 15), new THREE.Vector3(-24, 0.85, 15), 0.22, m.ochrePaint, 12);
  rodBetween(parent, new THREE.Vector3(-43, 0.85, 15.55), new THREE.Vector3(-24, 0.85, 15.55), 0.13, m.rust, 10);

  // Clothes line: a tiny lived-in detail, not a gameplay objective.
  for (const px of [-33, -25]) meshCylinder(parent, [0.045, 0.045], 2.1, [px, 1.05, -1], m.dark, 8);
  cable(parent, [new THREE.Vector3(-33, 2, -1), new THREE.Vector3(-29, 1.83, -1), new THREE.Vector3(-25, 2, -1)], 0.009, m.dark);
  for (let i = 0; i < 4; i++) {
    const cloth = meshBox(parent, [0.72, 0.85, 0.025], [-31.8 + i * 1.55, 1.42, -1], i % 2 ? m.cream : m.bluePaint);
    cloth.rotation.z = (i - 1.5) * 0.035;
  }

  createFence(parent, m, physics, -16, 13, 8, true, true);
  createFence(parent, m, physics, 18, 8, 7, false, true);
  createFence(parent, m, physics, -45, -16, 22, false, false);
  createFence(parent, m, physics, 46, -20, 24, false, false);

  // Manholes and concrete path joints.
  for (const [x, z] of [[-3, 12], [9, -3], [-22, 20], [28, -4]]) {
    const cover = new THREE.Mesh(new THREE.CircleGeometry(0.48, 20), m.dark);
    cover.rotation.x = -Math.PI / 2;
    cover.position.set(x, 0.035, z);
    cover.receiveShadow = true;
    parent.add(cover);
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.49, 20), m.metal);
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(x, 0.039, z);
    parent.add(rim);
  }
}
