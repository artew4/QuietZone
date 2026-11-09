import * as THREE from "three";
import type { MaterialLibrary } from "../../utils/materials";
import { labelTexture } from "../../utils/materials";
import { cable, meshBox, plane } from "../../utils/geometry";
import type { PhysicsSystem } from "../../systems/PhysicsSystem";
import type { BoxCollider } from "../../types";
import { createBarrel, createBicycle, createPallet, createTire } from "./props";
import { createWorkshop, type Workshop } from "./workshop";

export interface GarageCooperative {
  heroX: number;
  heroZ: number;
  doorPosition: THREE.Vector3;
  doorCollider: BoxCollider;
  isOpen: boolean;
  workshop: Workshop;
  toggleDoor: () => boolean;
  update: (dt: number) => void;
}

function garageDoorLeaf(m: MaterialLibrary, material: THREE.Material, direction: number): THREE.Group {
  const leaf = new THREE.Group();
  meshBox(leaf, [1.96, 2.55, 0.11], [direction * 0.98, 1.28, 0], material);
  for (let i = 0; i < 10; i++) {
    meshBox(leaf, [0.045, 2.45, 0.055], [direction * (0.1 + i * 0.195), 1.28, 0.08], m.metal);
  }
  for (const y of [0.48, 2.05]) meshBox(leaf, [0.36, 0.09, 0.12], [direction * 0.16, y, 0.11], m.rust);
  meshBox(leaf, [0.08, 0.28, 0.1], [direction * 1.73, 1.15, 0.12], m.dark);
  return leaf;
}

export function createGarageCooperative(parent: THREE.Group, m: MaterialLibrary, physics: PhysicsSystem): GarageCooperative {
  const row = new THREE.Group();
  parent.add(row);
  const heroX = 0, heroZ = 22;
  const width = 5.4, depth = 7, height = 3.1, gap = 0.22;
  const doorMaterials = [m.bluePaint, m.greenPaint, m.redPaint, m.ochrePaint, m.greenPaint, m.bluePaint, m.metal];
  const numbers = [15, 16, 18, 19, 20, 21, 22];
  let heroGroup = new THREE.Group();

  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * (width + gap);
    const group = new THREE.Group();
    group.position.set(x, 0, heroZ);
    row.add(group);
    const isHero = i === 3;
    if (isHero) heroGroup = group;
    const wallMaterial = i % 3 === 0 ? m.brickDark : m.brickRed;
    meshBox(group, [0.24, height, depth], [-width / 2, height / 2, 0], wallMaterial);
    meshBox(group, [0.24, height, depth], [width / 2, height / 2, 0], wallMaterial);
    meshBox(group, [width, height, 0.24], [0, height / 2, -depth / 2], wallMaterial);
    meshBox(group, [width + 0.25, 0.18, depth + 0.38], [0, height + 0.03, 0.08], m.roof);
    meshBox(group, [width + 0.18, 0.22, 0.24], [0, height - 0.1, depth / 2 + 0.03], m.concrete);
    // Slight roof lip, gutter and a vent give every garage a complete silhouette.
    meshBox(group, [width + 0.38, 0.09, 0.18], [0, height + 0.04, depth / 2 + 0.25], m.rust);
    meshBox(group, [0.65, 0.38, 0.08], [1.8, 2.7, depth / 2 + 0.09], m.dark);
    for (let v = 0; v < 4; v++) meshBox(group, [0.52, 0.025, 0.04], [1.8, 2.58 + v * 0.075, depth / 2 + 0.15], m.metal);

    const numberMaterial = new THREE.MeshStandardMaterial({ map: labelTexture(String(isHero ? 17 : numbers[i]), "#d8cda9", "#384039"), roughness: 0.9 });
    plane(group, 0.48, 0.36, [-1.92, 2.68, depth / 2 + 0.16], numberMaterial);

    if (!isHero) {
      meshBox(group, [width, height, 0.22], [0, height / 2, depth / 2], wallMaterial);
      meshBox(group, [4.45, 2.55, 0.12], [0, 1.28, depth / 2 + 0.15], doorMaterials[i]);
      for (let d = 0; d < 22; d++) meshBox(group, [0.045, 2.47, 0.045], [-2.1 + d * 0.2, 1.28, depth / 2 + 0.23], m.metal);
      meshBox(group, [0.1, 0.32, 0.12], [0.18, 1.12, depth / 2 + 0.28], m.dark);
      const lock = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 5, 10, Math.PI), m.rust);
      lock.position.set(0.18, 1.33, depth / 2 + 0.3);
      group.add(lock);
      physics.addBox(x, heroZ, width, depth, height);
    } else {
      meshBox(group, [0.68, height, 0.24], [-2.36, height / 2, depth / 2], wallMaterial);
      meshBox(group, [0.68, height, 0.24], [2.36, height / 2, depth / 2], wallMaterial);
      meshBox(group, [4.1, 0.48, 0.24], [0, 2.87, depth / 2], wallMaterial);
      physics.addBox(x - width / 2, heroZ, 0.28, depth, height);
      physics.addBox(x + width / 2, heroZ, 0.28, depth, height);
      physics.addBox(x, heroZ - depth / 2, width, 0.28, height);
      physics.addBox(x - 2.36, heroZ + depth / 2, 0.7, 0.28, height);
      physics.addBox(x + 2.36, heroZ + depth / 2, 0.7, 0.28, height);
    }

    // Small puddles and individually arranged objects, never a mirrored row of props.
    if (i !== 3) {
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.75 + (i % 2) * 0.25, 18), m.water);
      puddle.scale.x = 1.8;
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(0.7 - i * 0.12, 0.025, depth / 2 + 1.15);
      group.add(puddle);
    }
    if (i === 0) { createTire(group, m, -1.7, 0, 4.25, true); createTire(group, m, -1.1, 0, 4.35); }
    if (i === 1) createBarrel(group, m, 1.65, 4.2);
    if (i === 2) createPallet(group, m, -1.4, 4.3, 0.18);
    if (i === 4) createBicycle(group, m, 1.25, 4.25, -0.15);
    if (i === 5) { createBarrel(group, m, -1.7, 4.15, m.bluePaint); createTire(group, m, -1.1, 0, 4.3); }
    if (i === 6) {
      meshBox(group, [0.85, 0.55, 0.65], [1.6, 0.28, 4.1], m.wood, 0.035);
      meshBox(group, [0.75, 0.08, 0.55], [1.6, 0.6, 4.1], m.woodLight);
    }
  }

  const leftDoor = garageDoorLeaf(m, m.greenPaint, 1);
  const rightDoor = garageDoorLeaf(m, m.greenPaint, -1);
  leftDoor.position.set(-2.02, 0, depth / 2 + 0.18);
  rightDoor.position.set(2.02, 0, depth / 2 + 0.18);
  leftDoor.userData.dynamic = true;
  rightDoor.userData.dynamic = true;
  heroGroup.add(leftDoor, rightDoor);

  const coopSign = new THREE.MeshStandardMaterial({ map: labelTexture("ГАРАЖНЫЙ КООПЕРАТИВ", "#bcb28f", "#585c4f", "«РАДИО» · 1984"), roughness: 1 });
  plane(row, 5.4, 0.85, [-13.8, 3.75, heroZ + 3.1], coopSign);
  meshBox(row, [0.1, 1.2, 0.1], [-16, 3.25, heroZ + 3.0], m.dark);
  meshBox(row, [0.1, 1.2, 0.1], [-11.6, 3.25, heroZ + 3.0], m.dark);

  // Electrical service cables tie the row together.
  for (const x of [-21, 21]) meshBox(row, [0.16, 4.5, 0.16], [x, 2.25, heroZ + 1.8], m.wood);
  cable(row, [new THREE.Vector3(-21, 4.4, heroZ + 1.8), new THREE.Vector3(0, 3.9, heroZ + 1.8), new THREE.Vector3(21, 4.4, heroZ + 1.8)], 0.022, m.black);
  cable(row, [new THREE.Vector3(-21, 4.25, heroZ + 2.05), new THREE.Vector3(0, 3.78, heroZ + 2.05), new THREE.Vector3(21, 4.25, heroZ + 2.05)], 0.015, m.black);

  const workshop = createWorkshop(row, m, physics, heroX, heroZ);
  const doorCollider = physics.addBox(heroX, heroZ + depth / 2 + 0.15, 4.1, 0.32, 2.6, 0, true);
  let openAmount = 0;
  const result: GarageCooperative = {
    heroX, heroZ,
    doorPosition: new THREE.Vector3(heroX, 1.25, heroZ + depth / 2 + 0.65),
    doorCollider,
    isOpen: false,
    workshop,
    toggleDoor: () => {
      result.isOpen = !result.isOpen;
      return result.isOpen;
    },
    update: (dt: number) => {
      const target = result.isOpen ? 1 : 0;
      openAmount += (target - openAmount) * (1 - Math.exp(-4.2 * dt));
      leftDoor.rotation.y = -openAmount * Math.PI * 0.53;
      rightDoor.rotation.y = openAmount * Math.PI * 0.53;
      doorCollider.enabled = openAmount < 0.58;
    },
  };
  return result;
}
