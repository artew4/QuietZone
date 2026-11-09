import * as THREE from "three";
import type { MaterialLibrary } from "../../utils/materials";
import { labelTexture } from "../../utils/materials";
import { cable, meshBox, meshCylinder, plane, rodBetween } from "../../utils/geometry";
import { mulberry32, pick, range } from "../../utils/random";
import type { PhysicsSystem } from "../../systems/PhysicsSystem";

interface BuildingOptions {
  x: number;
  z: number;
  width: number;
  depth: number;
  floors: number;
  floorHeight: number;
  material: THREE.Material;
  seed: number;
  balconies?: boolean;
  brickBase?: boolean;
}

function createWindow(m: MaterialLibrary, lit: boolean, curtain: THREE.Material, wide = 1.28): THREE.Group {
  const group = new THREE.Group();
  meshBox(group, [wide + 0.18, 1.55, 0.12], [0, 0, 0], m.dark);
  meshBox(group, [wide, 1.37, 0.055], [0, 0, 0.075], lit ? m.glassWarm : m.glass);
  meshBox(group, [wide + 0.24, 0.09, 0.18], [0, 0.77, 0.08], m.whitePaint);
  meshBox(group, [wide + 0.24, 0.09, 0.2], [0, -0.77, 0.1], m.whitePaint);
  meshBox(group, [0.075, 1.48, 0.16], [-wide / 2 - 0.055, 0, 0.09], m.whitePaint);
  meshBox(group, [0.075, 1.48, 0.16], [wide / 2 + 0.055, 0, 0.09], m.whitePaint);
  meshBox(group, [0.055, 1.38, 0.12], [0, 0, 0.12], m.cream);
  meshBox(group, [wide, 0.045, 0.12], [0, 0.08, 0.12], m.cream);
  meshBox(group, [wide + 0.42, 0.1, 0.36], [0, -0.86, 0.13], m.concreteLight);
  if (lit) {
    meshBox(group, [wide * 0.25, 1.25, 0.025], [-wide * 0.34, 0, 0.112], curtain);
    meshBox(group, [wide * 0.18, 1.25, 0.025], [wide * 0.39, 0, 0.112], curtain);
  }
  return group;
}

function addBalcony(group: THREE.Group, m: MaterialLibrary, x: number, y: number, front: number, glazed: boolean): void {
  const balcony = new THREE.Group();
  balcony.position.set(x, y, front);
  meshBox(balcony, [2.25, 0.16, 1.05], [0, -0.7, 0.48], m.concrete);
  meshBox(balcony, [2.25, 0.09, 0.08], [0, 0.12, 1], m.greenPaint);
  meshBox(balcony, [0.07, 0.85, 0.07], [-1.08, -0.3, 1], m.greenPaint);
  meshBox(balcony, [0.07, 0.85, 0.07], [1.08, -0.3, 1], m.greenPaint);
  for (let i = 0; i < 9; i++) {
    meshBox(balcony, [0.035, 0.78, 0.04], [-0.95 + i * 0.2375, -0.32, 1], m.metal);
  }
  meshBox(balcony, [0.07, 0.85, 1], [-1.08, -0.3, 0.5], m.greenPaint);
  meshBox(balcony, [0.07, 0.85, 1], [1.08, -0.3, 0.5], m.greenPaint);
  if (glazed) {
    meshBox(balcony, [2.1, 1.25, 0.045], [0, 0.35, 0.96], m.glass);
    meshBox(balcony, [0.055, 1.35, 0.07], [0, 0.35, 1], m.whitePaint);
    meshBox(balcony, [2.25, 0.08, 0.12], [0, 1.02, 1], m.whitePaint);
  }
  group.add(balcony);
}

function addEntrance(group: THREE.Group, m: MaterialLibrary, x: number, front: number, number: number): void {
  meshBox(group, [1.45, 2.25, 0.16], [x, 1.18, front + 0.08], m.dark);
  meshBox(group, [1.18, 2.08, 0.12], [x, 1.12, front + 0.18], m.greenPaint);
  meshBox(group, [0.48, 0.65, 0.035], [x, 1.55, front + 0.255], m.glass);
  meshBox(group, [0.045, 0.34, 0.07], [x + 0.42, 1.02, front + 0.28], m.cream);
  meshBox(group, [2.4, 0.17, 1.25], [x, 2.45, front + 0.5], m.concrete);
  for (let i = 0; i < 3; i++) {
    meshBox(group, [1.85 + i * 0.25, 0.14, 0.38], [x, 0.07 + (2 - i) * 0.12, front + 0.45 + i * 0.32], m.concreteLight);
  }
  for (let i = 0; i < 6; i++) {
    meshBox(group, [0.19, 0.26, 0.14], [x - 1.25 + (i % 2) * 0.21, 1.45 - Math.floor(i / 2) * 0.28, front + 0.16], m.bluePaint, 0.02);
  }
  const signMat = new THREE.MeshStandardMaterial({ map: labelTexture(String(number), "#ded4b7", "#3f493f"), roughness: 0.9 });
  plane(group, 0.48, 0.48, [x + 1.45, 2.05, front + 0.12], signMat);
  const light = meshBox(group, [0.25, 0.18, 0.22], [x, 2.64, front + 0.22], m.lamp, 0.04);
  light.castShadow = false;
}

function addRoofAntenna(group: THREE.Group, m: MaterialLibrary, x: number, y: number, z: number): void {
  rodBetween(group, new THREE.Vector3(x, y, z), new THREE.Vector3(x, y + 2.4, z), 0.035, m.metal);
  rodBetween(group, new THREE.Vector3(x - 1.1, y + 1.95, z), new THREE.Vector3(x + 1.1, y + 1.95, z), 0.025, m.metal);
  for (let i = 0; i < 5; i++) {
    const ax = x - 0.8 + i * 0.4;
    rodBetween(group, new THREE.Vector3(ax, y + 1.95, z - 0.35), new THREE.Vector3(ax, y + 1.95, z + 0.35), 0.018, m.metal, 6);
  }
}

export function createResidentialBuilding(parent: THREE.Group, m: MaterialLibrary, physics: PhysicsSystem, options: BuildingOptions): THREE.Group {
  const { x, z, width, depth, floors, floorHeight, seed } = options;
  const random = mulberry32(seed);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  parent.add(group);
  const height = floors * floorHeight + 0.45;
  const front = depth / 2;

  meshBox(group, [width, height, depth], [0, height / 2, 0], options.material);
  meshBox(group, [width + 0.12, 0.65, depth + 0.12], [0, 0.33, 0], options.brickBase ? m.brickDark : m.concrete);
  meshBox(group, [width + 0.32, 0.2, depth + 0.32], [0, height - 0.15, 0], m.concreteLight);
  meshBox(group, [width + 0.6, 0.24, depth + 0.6], [0, height + 0.08, 0], m.roof);
  meshBox(group, [width + 0.25, 0.45, 0.22], [0, height + 0.28, front], m.concrete);
  meshBox(group, [width + 0.25, 0.45, 0.22], [0, height + 0.28, -front], m.concrete);

  const columns = Math.max(3, Math.floor(width / 3.5));
  const spacing = width / columns;
  const curtainMaterials = [m.fabric, m.cream, m.greenPaint, m.ochrePaint];
  for (let floor = 0; floor < floors; floor++) {
    const y = 1.55 + floor * floorHeight;
    for (let col = 0; col < columns; col++) {
      const wx = -width / 2 + spacing * (col + 0.5);
      const entranceColumn = floor === 0 && col === Math.floor(columns / 2);
      if (!entranceColumn) {
        const win = createWindow(m, random() > 0.64, pick(random, curtainMaterials));
        win.position.set(wx, y, front + 0.065);
        group.add(win);
        if (options.balconies && floor > 0 && col % 3 === 1) addBalcony(group, m, wx, y, front + 0.16, random() > 0.45);
      }
      const back = createWindow(m, random() > 0.78, pick(random, curtainMaterials));
      back.position.set(wx, y, -front - 0.065);
      back.rotation.y = Math.PI;
      group.add(back);
    }
    const bandY = 0.55 + floor * floorHeight;
    meshBox(group, [width + 0.08, 0.075, 0.08], [0, bandY, front + 0.06], m.concreteLight);
  }

  for (const side of [-1, 1]) {
    for (let floor = 0; floor < floors; floor++) {
      for (let col = 0; col < Math.max(2, Math.floor(depth / 3.4)); col++) {
        const count = Math.max(2, Math.floor(depth / 3.4));
        const win = createWindow(m, random() > 0.76, pick(random, curtainMaterials));
        win.position.set(side * (width / 2 + 0.065), 1.55 + floor * floorHeight, -depth / 2 + depth / count * (col + 0.5));
        win.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
        group.add(win);
      }
    }
  }

  addEntrance(group, m, -width / 2 + spacing * (Math.floor(columns / 2) + 0.5), front, seed % 2 ? 12 : 7);
  for (const px of [-width / 2 + 0.28, width / 2 - 0.28]) {
    meshCylinder(group, [0.065, 0.065], height, [px, height / 2, front + 0.18], m.rust, 8);
    meshBox(group, [0.25, 0.18, 0.3], [px, 0.2, front + 0.28], m.rust);
  }
  addRoofAntenna(group, m, -width * 0.25, height + 0.25, 0);
  addRoofAntenna(group, m, width * 0.28, height + 0.25, -depth * 0.15);
  for (let i = 0; i < 3; i++) {
    meshBox(group, [0.85, 0.55, 0.85], [range(random, -width * 0.35, width * 0.35), height + 0.4, range(random, -depth * 0.25, depth * 0.25)], m.concrete);
  }

  // A faded wall slogan, intentionally quiet rather than a quest marker.
  const slogan = new THREE.MeshStandardMaterial({ map: labelTexture("МИР · ТРУД · НАУКА", "#b8a477", "#685f4b"), roughness: 1 });
  const sloganMesh = plane(group, Math.min(7, width * 0.35), 0.75, [-width * 0.22, 0.95, front + 0.075], slogan);
  sloganMesh.castShadow = false;

  physics.addBox(x, z, width, depth, height);
  return group;
}

export function createScienceBlock(parent: THREE.Group, m: MaterialLibrary, physics: PhysicsSystem, x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  parent.add(group);
  const width = 17, depth = 10, height = 4.7, front = depth / 2;
  meshBox(group, [width, height, depth], [0, height / 2, 0], m.brickDark);
  meshBox(group, [width + 0.35, 0.3, depth + 0.35], [0, height + 0.05, 0], m.concrete);
  meshBox(group, [width + 0.15, 0.65, depth + 0.15], [0, 0.33, 0], m.concrete);
  for (let i = 0; i < 6; i++) {
    const win = createWindow(m, i === 4, m.cream, 1.65);
    win.scale.y = 1.25;
    win.position.set(-6.8 + i * 2.7, 2.45, front + 0.07);
    group.add(win);
  }
  meshBox(group, [1.65, 2.65, 0.18], [-6.6, 1.38, front + 0.12], m.dark);
  meshBox(group, [1.4, 2.45, 0.12], [-6.6, 1.3, front + 0.23], m.bluePaint);
  meshBox(group, [2.5, 0.18, 1.1], [-6.6, 2.9, front + 0.45], m.concrete);
  const sign = new THREE.MeshStandardMaterial({ map: labelTexture("НАУЧНЫЙ КОРПУС № 3", "#c4b992", "#52574d", "ОПЫТНАЯ СТАНЦИЯ"), roughness: 0.95 });
  plane(group, 6.8, 1.05, [1.4, 4.02, front + 0.12], sign);
  for (let i = 0; i < 3; i++) {
    meshBox(group, [1.45, 0.8, 1.25], [-4 + i * 4, height + 0.5, -1], m.metal);
    for (let j = 0; j < 5; j++) meshBox(group, [1.1, 0.045, 0.08], [-4 + i * 4, height + 0.28 + j * 0.11, -0.34], m.dark);
  }
  const doorSign = new THREE.MeshStandardMaterial({ map: labelTexture("СЛУЖЕБНЫЙ ВХОД", "#d2c79f", "#554c3f"), roughness: 1 });
  plane(group, 1.7, 0.42, [-6.6, 2.35, front + 0.3], doorSign);
  cable(group, [new THREE.Vector3(-8.2, 3.8, front + 0.18), new THREE.Vector3(-2, 3.65, front + 0.22), new THREE.Vector3(7.8, 3.85, front + 0.18)], 0.025, m.black);
  physics.addBox(x, z, width, depth, height);
  return group;
}
