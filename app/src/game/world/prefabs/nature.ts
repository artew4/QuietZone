import * as THREE from "three";
import type { MaterialLibrary } from "../../utils/materials";
import { meshCylinder, rodBetween } from "../../utils/geometry";
import { mulberry32, pick, range } from "../../utils/random";
import type { PhysicsSystem } from "../../systems/PhysicsSystem";
import { QUALITY } from "../../config";

export interface NatureResult {
  swaying: THREE.Object3D[];
}

export function createTree(parent: THREE.Group, m: MaterialLibrary, physics: PhysicsSystem, x: number, z: number, scale: number, seed: number, swaying: THREE.Object3D[], birch = true): void {
  const random = mulberry32(seed);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  parent.add(group);
  const height = range(random, 5.8, 8.4);
  const trunk = meshCylinder(group, [0.16, 0.28], height * 0.72, [0, height * 0.36, 0], birch ? m.birch : m.wood, 9);
  trunk.rotation.z = range(random, -0.035, 0.035);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + random() * 0.5;
    const start = new THREE.Vector3(0, height * range(random, 0.38, 0.64), 0);
    const end = new THREE.Vector3(Math.cos(angle) * range(random, 0.7, 1.5), height * range(random, 0.67, 0.88), Math.sin(angle) * range(random, 0.7, 1.5));
    rodBetween(group, start, end, 0.065, birch ? m.birch : m.wood, 7);
  }
  const crown = new THREE.Group();
  crown.position.y = height * 0.67;
  if (swaying.length < 10 && seed % 3 === 0) {
    crown.userData.dynamic = true;
    swaying.push(crown);
  }
  group.add(crown);
  const leafMaterials = birch ? [m.leavesGold, m.leavesYellow, m.leavesGreen] : [m.leavesGreen, m.leavesGold];
  for (let i = 0; i < 11; i++) {
    const geometry = new THREE.IcosahedronGeometry(range(random, 0.75, 1.35), 1);
    const leaf = new THREE.Mesh(geometry, pick(random, leafMaterials));
    const angle = random() * Math.PI * 2;
    const radius = range(random, 0.3, 1.65);
    leaf.position.set(Math.cos(angle) * radius, range(random, -0.35, 2.1), Math.sin(angle) * radius);
    leaf.scale.set(range(random, 0.8, 1.25), range(random, 0.75, 1.35), range(random, 0.8, 1.2));
    leaf.rotation.set(random(), random(), random());
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    crown.add(leaf);
  }
  physics.addCircle(x, z, 0.27 * scale, height * scale);
}

export function createNature(parent: THREE.Group, m: MaterialLibrary, physics: PhysicsSystem): NatureResult {
  const swaying: THREE.Object3D[] = [];
  const random = mulberry32(20261110);
  const authored: Array<[number, number, number, boolean]> = [
    [-10, 29, 1.05, true], [12, 30, 0.95, true], [-25, 25, 1.1, false], [26, 29, 1.05, true],
    [-14, 5, 1.15, true], [12, 2, 1.0, true], [-7, -12, 0.9, true], [8, -20, 1.05, true],
    [-36, -4, 1.15, true], [38, -14, 1.1, false], [-15, -33, 1.0, true], [13, -37, 1.1, true],
    [-38, 37, 1.2, false], [39, 37, 1.15, true], [-46, 13, 1.25, true], [49, 6, 1.2, false],
  ];
  authored.forEach(([x, z, scale, birch], i) => createTree(parent, m, physics, x, z, scale, 400 + i * 17, swaying, birch));
  for (let i = 0; i < 42; i++) {
    const side = i % 4;
    const along = range(random, -70, 70);
    const x = side < 2 ? (side === 0 ? -1 : 1) * range(random, 58, 73) : along;
    const z = side >= 2 ? (side === 2 ? -1 : 1) * range(random, 56, 73) : along;
    createTree(parent, m, physics, x, z, range(random, 0.8, 1.35), 900 + i * 23, swaying, random() > 0.32);
  }

  const leafGeometry = new THREE.CircleGeometry(0.085, 5);
  const leaves = new THREE.InstancedMesh(leafGeometry, m.leavesGold, QUALITY.GROUND_LEAVES);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < QUALITY.GROUND_LEAVES; i++) {
    const cluster = authored[i % authored.length];
    dummy.position.set(cluster[0] + range(random, -5, 5), 0.035, cluster[1] + range(random, -5, 5));
    dummy.rotation.set(-Math.PI / 2 + range(random, -0.12, 0.12), 0, random() * Math.PI * 2);
    dummy.scale.set(range(random, 0.65, 1.5), range(random, 0.65, 1.5), 1);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
  }
  leaves.receiveShadow = true;
  leaves.userData.dynamic = true;
  parent.add(leaves);

  const grassGeometry = new THREE.ConeGeometry(0.09, 0.48, 3);
  grassGeometry.translate(0, 0.24, 0);
  const grass = new THREE.InstancedMesh(grassGeometry, m.grass, QUALITY.GRASS_TUFTS);
  for (let i = 0; i < QUALITY.GRASS_TUFTS; i++) {
    let x = range(random, -68, 68), z = range(random, -65, 65);
    if (Math.abs(x) < 43 && z > -42 && z < 43) {
      x += x > 0 ? 34 : -34;
    }
    dummy.position.set(x, 0, z);
    dummy.rotation.set(range(random, -0.12, 0.12), random() * Math.PI, range(random, -0.12, 0.12));
    dummy.scale.set(range(random, 0.6, 1.4), range(random, 0.5, 1.5), range(random, 0.6, 1.4));
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
  }
  grass.castShadow = false;
  grass.receiveShadow = true;
  grass.userData.dynamic = true;
  parent.add(grass);

  // Low, irregular shrubs soften path edges and the bases of the buildings.
  const shrubGeometry = new THREE.IcosahedronGeometry(0.55, 1);
  const shrubs = new THREE.InstancedMesh(shrubGeometry, m.leavesGreen, 112);
  for (let i = 0; i < 112; i++) {
    let x: number, z: number;
    if (i < 52) {
      x = (i % 2 ? -1 : 1) * range(random, 3.4, 5.7);
      z = range(random, -35, 19);
    } else if (i < 82) {
      x = range(random, -39, -15);
      z = random() > 0.5 ? range(random, -14, -11) : range(random, -29, -27);
    } else {
      x = range(random, 14, 34);
      z = range(random, -22, -19);
    }
    dummy.position.set(x, range(random, 0.28, 0.48), z);
    dummy.rotation.set(random() * 0.3, random() * Math.PI, random() * 0.25);
    dummy.scale.set(range(random, 0.65, 1.35), range(random, 0.55, 1.15), range(random, 0.65, 1.4));
    dummy.updateMatrix();
    shrubs.setMatrixAt(i, dummy.matrix);
  }
  shrubs.castShadow = true;
  shrubs.receiveShadow = true;
  shrubs.userData.dynamic = true;
  parent.add(shrubs);
  return { swaying };
}
