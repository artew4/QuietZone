import * as THREE from "three";
import type { MaterialLibrary } from "../utils/materials";
import { optimizeStatic, meshBox, plane } from "../utils/geometry";
import { mulberry32, range } from "../utils/random";
import { WORLD_CONFIG } from "../config";
import type { PhysicsSystem } from "../systems/PhysicsSystem";
import { createResidentialBuilding, createScienceBlock } from "./prefabs/buildings";
import { createGarageCooperative, type GarageCooperative } from "./prefabs/garage";
import { createNature } from "./prefabs/nature";
import { createCourtyardProps, createPlayground } from "./prefabs/props";
import { createTechnicalYard } from "./prefabs/technical";
import { EnvironmentSystem } from "../systems/EnvironmentSystem";

export class World {
  readonly root = new THREE.Group();
  readonly garage: GarageCooperative;
  private environment: EnvironmentSystem;
  private oscilloscopeAccumulator = 0;

  constructor(scene: THREE.Scene, private m: MaterialLibrary, physics: PhysicsSystem) {
    scene.add(this.root);
    this.createGround(physics);

    createResidentialBuilding(this.root, m, physics, {
      x: -27, z: -20, width: 25, depth: 10, floors: 3, floorHeight: 2.75,
      material: m.brickRed, seed: 12, balconies: true, brickBase: true,
    });
    createResidentialBuilding(this.root, m, physics, {
      x: 24, z: -27, width: 21, depth: 9, floors: 2, floorHeight: 2.7,
      material: m.plasterYellow, seed: 7, balconies: true,
    });
    createScienceBlock(this.root, m, physics, 31, 13);
    this.garage = createGarageCooperative(this.root, m, physics);
    const swing = createPlayground(this.root, m, physics, 0, -10);
    createCourtyardProps(this.root, m, physics);
    const technical = createTechnicalYard(this.root, m, physics, 34, 0);
    // Correct world-space fence colliders for the technical yard.
    physics.addBox(34, -5.8, 12, 0.18, 1.4);
    physics.addBox(40, -1.8, 0.18, 8, 1.4);
    const nature = createNature(this.root, m, physics);
    this.createDistantDistrict();
    this.environment = new EnvironmentSystem(this.root, nature.swaying, swing, technical.indicator);

    const half = WORLD_CONFIG.PLAYABLE_HALF_SIZE;
    physics.addBox(-half - 1, 0, 2, half * 2 + 4, 8);
    physics.addBox(half + 1, 0, 2, half * 2 + 4, 8);
    physics.addBox(0, -half - 1, half * 2 + 4, 2, 8);
    physics.addBox(0, half + 1, half * 2 + 4, 2, 8);
    optimizeStatic(this.root);
  }

  private createGround(physics: PhysicsSystem): void {
    meshBox(this.root, [WORLD_CONFIG.SIZE, 0.12, WORLD_CONFIG.SIZE], [0, -0.065, 0], this.m.soil);
    meshBox(this.root, [98, 0.035, 91], [0, -0.005, -3], this.m.lawn);
    meshBox(this.root, [180, 0.045, 8.5], [0, 0.012, 39], this.m.asphalt);
    meshBox(this.root, [8.5, 0.045, 145], [45, 0.012, -15], this.m.asphalt);
    meshBox(this.root, [4.2, 0.055, 58], [0, 0.018, -4], this.m.concrete);
    meshBox(this.root, [68, 0.055, 3.4], [0, 0.02, -7], this.m.concrete);
    meshBox(this.root, [3, 0.055, 23], [-20, 0.02, -14], this.m.concrete);
    meshBox(this.root, [3, 0.055, 19], [17, 0.02, -18], this.m.concrete);
    meshBox(this.root, [42, 0.05, 10], [0, 0.018, 29.5], this.m.asphalt);
    meshBox(this.root, [4, 0.05, 24], [31, 0.018, 5], this.m.concrete);

    // Sidewalks, curbs and expansion joints articulate the street scale.
    for (const z of [33.9, 44.1]) {
      meshBox(this.root, [100, 0.16, 0.28], [-8, 0.08, z], this.m.concreteLight);
      for (let i = 0; i < 35; i++) meshBox(this.root, [1.8, 0.07, 1.25], [-52 + i * 2.1, 0.06, z + (z < 39 ? -0.8 : 0.8)], this.m.concrete);
    }
    for (let i = 0; i < 23; i++) {
      meshBox(this.root, [4.05, 0.012, 0.035], [0, 0.052, -31 + i * 2.45], this.m.dark);
    }
    for (let i = 0; i < 16; i++) {
      meshBox(this.root, [0.035, 0.012, 3.25], [-31 + i * 4.1, 0.054, -7], this.m.dark);
    }
    // Small grass islands break up the paths without blocking the walking routes.
    for (const [x, z, w, d] of [[-9, -4, 6, 7], [10, -13, 7, 6], [-30, 5, 8, 5], [24, 24, 7, 4]] as const) {
      meshBox(this.root, [w, 0.09, d], [x, 0.025, z], this.m.soil, 0.12);
      for (const side of [-1, 1]) meshBox(this.root, [w + 0.2, 0.13, 0.12], [x, 0.07, z + side * d / 2], this.m.concreteLight);
    }

    const random = mulberry32(441);
    for (let i = 0; i < 16; i++) {
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(range(random, 0.25, 0.75), 14), this.m.water);
      puddle.rotation.x = -Math.PI / 2;
      puddle.scale.x = range(random, 1.2, 2.4);
      puddle.position.set(range(random, -38, 38), 0.052, range(random, 34.8, 42.5));
      this.root.add(puddle);
    }
    void physics;
  }

  private createDistantDistrict(): void {
    const random = mulberry32(877);
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const radius = range(random, 72, 86);
      const width = range(random, 9, 18), depth = range(random, 7, 12), height = range(random, 5, 12);
      const material = i % 3 === 0 ? this.m.brickDark : i % 3 === 1 ? this.m.plasterGreen : this.m.concrete;
      meshBox(this.root, [width, height, depth], [Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius], material);
      meshBox(this.root, [width + 0.3, 0.25, depth + 0.3], [Math.cos(angle) * radius, height + 0.1, Math.sin(angle) * radius], this.m.roof);
    }
    // The road visibly continues beyond the walkable district.
    meshBox(this.root, [8.5, 0.04, 70], [45, 0.01, -88], this.m.asphalt);
  }

  update(time: number, dt: number): void {
    this.garage.update(dt);
    this.environment.update(time, dt);
    this.oscilloscopeAccumulator += dt;
    if (this.oscilloscopeAccumulator >= 1 / 20) {
      this.garage.workshop.update(time);
      this.oscilloscopeAccumulator = 0;
    }
  }

  isInsideLab(position: THREE.Vector3): boolean {
    return Math.abs(position.x - this.garage.heroX) < 2.5 && Math.abs(position.z - this.garage.heroZ) < 3.35;
  }

  getLocation(position: THREE.Vector3): string {
    if (this.isInsideLab(position)) return "Гараж № 17 · Лаборатория";
    if (Math.abs(position.x) < 25 && position.z > 15 && position.z < 34) return "Гаражный кооператив";
    if (position.x > 24 && position.z > -8 && position.z < 20) return "Техническая территория";
    if (position.z < 10 && position.z > -42 && Math.abs(position.x) < 43) return "Центральный двор";
    return "Окраина научного городка";
  }
}
