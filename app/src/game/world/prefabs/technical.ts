import * as THREE from "three";
import type { MaterialLibrary } from "../../utils/materials";
import { cable, meshBox, meshCylinder, plane, rodBetween } from "../../utils/geometry";
import { labelTexture } from "../../utils/materials";
import type { PhysicsSystem } from "../../systems/PhysicsSystem";
import { createBarrel, createFence } from "./props";

export interface TechnicalYard {
  indicator: THREE.MeshStandardMaterial;
}

export function createTechnicalYard(parent: THREE.Group, m: MaterialLibrary, physics: PhysicsSystem, x: number, z: number): TechnicalYard {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  parent.add(group);

  // Transformer booth with ribbed doors, insulators and stencilled warning.
  meshBox(group, [4.1, 3.15, 3.4], [0, 1.58, 0], m.concrete);
  meshBox(group, [4.45, 0.22, 3.75], [0, 3.22, 0], m.roof);
  meshBox(group, [2.15, 2.35, 0.14], [0, 1.22, 1.76], m.greenPaint);
  for (let i = 0; i < 10; i++) meshBox(group, [0.055, 2.2, 0.06], [-0.94 + i * 0.21, 1.22, 1.86], m.metal);
  const warning = new THREE.MeshStandardMaterial({ map: labelTexture("ОПАСНО", "#d2bd77", "#6e4434", "ВЫСОКОЕ НАПРЯЖЕНИЕ"), roughness: 0.9 });
  plane(group, 1.15, 0.75, [0, 1.65, 1.94], warning);
  for (const px of [-1.3, 1.3]) {
    meshCylinder(group, [0.12, 0.15], 0.65, [px, 3.62, 0], m.rust, 10);
    for (let i = 0; i < 4; i++) meshCylinder(group, [0.19, 0.19], 0.055, [px, 3.42 + i * 0.14, 0], m.cream, 10);
  }
  physics.addBox(x, z, 4.1, 3.4, 3.2);

  // Outdoor electrical cabinet and old generator.
  meshBox(group, [1.15, 1.75, 0.65], [-3.15, 0.9, 0.3], m.metal, 0.06);
  meshBox(group, [0.98, 1.55, 0.055], [-3.15, 0.92, 0.66], m.bluePaint);
  for (let i = 0; i < 5; i++) meshBox(group, [0.62, 0.035, 0.04], [-3.15, 0.48 + i * 0.12, 0.7], m.dark);
  const indicator = new THREE.MeshStandardMaterial({ color: 0xffb65f, emissive: 0xff8a32, emissiveIntensity: 1.6 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), indicator);
  lamp.position.set(-3.15, 1.48, 0.72);
  group.add(lamp);

  const generator = new THREE.Group();
  generator.position.set(3.4, 0, -0.5);
  group.add(generator);
  meshBox(generator, [2.1, 1.15, 1.15], [0, 0.72, 0], m.ochrePaint, 0.1);
  meshBox(generator, [2.3, 0.15, 1.35], [0, 0.15, 0], m.dark);
  for (let i = 0; i < 8; i++) meshBox(generator, [0.055, 0.72, 0.06], [-0.72 + i * 0.2, 0.76, 0.6], m.dark);
  meshCylinder(generator, [0.13, 0.13], 1.65, [0.65, 1.65, -0.25], m.rust, 10);
  createBarrel(group, m, 4.6, 1.25);

  // Cable channels and pipe run.
  for (let i = 0; i < 3; i++) {
    rodBetween(group, new THREE.Vector3(-4.5, 0.22 + i * 0.18, -2.3), new THREE.Vector3(5, 0.22 + i * 0.18, -2.3), 0.07, i === 1 ? m.rust : m.metal);
  }
  meshBox(group, [9.5, 0.16, 0.65], [0.2, 0.08, -2.3], m.concrete);

  // Antenna mast: guy wires and a small directional array.
  const mastX = 5.4, mastZ = -3.8;
  rodBetween(group, new THREE.Vector3(mastX, 0, mastZ), new THREE.Vector3(mastX, 8.5, mastZ), 0.075, m.metal);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    cable(group, [new THREE.Vector3(mastX, 6.4, mastZ), new THREE.Vector3(mastX + Math.cos(angle) * 3.2, 0.1, mastZ + Math.sin(angle) * 3.2)], 0.012, m.dark);
  }
  rodBetween(group, new THREE.Vector3(mastX - 1.6, 7.7, mastZ), new THREE.Vector3(mastX + 1.6, 7.7, mastZ), 0.035, m.metal);
  for (let i = 0; i < 7; i++) {
    const ax = mastX - 1.35 + i * 0.45;
    rodBetween(group, new THREE.Vector3(ax, 7.7, mastZ - 0.55), new THREE.Vector3(ax, 7.7, mastZ + 0.55), 0.022, m.metal, 6);
  }

  createFence(group, m, physics, 0, -5.8, 12, true, false, false);
  createFence(group, m, physics, 6, -1.8, 8, false, false, false);
  return { indicator };
}
