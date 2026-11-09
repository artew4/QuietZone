import type { BoxCollider, CircleCollider, Collider } from "../types";

const CELL_SIZE = 8;

export class PhysicsSystem {
  private colliders: Collider[] = [];
  private dynamic: Collider[] = [];
  private grid = new Map<string, Collider[]>();
  private nearby: Collider[] = [];
  private queryId = 1;

  addBox(x: number, z: number, width: number, depth: number, height = 4, y = 0, dynamic = false): BoxCollider {
    const collider: BoxCollider = {
      kind: "box", minX: x - width / 2, maxX: x + width / 2,
      minZ: z - depth / 2, maxZ: z + depth / 2,
      minY: y, maxY: y + height, enabled: true, stamp: 0,
    };
    this.add(collider, dynamic);
    return collider;
  }

  addCircle(x: number, z: number, radius: number, height = 5): CircleCollider {
    const collider: CircleCollider = {
      kind: "circle", x, z, radius, minY: 0, maxY: height, enabled: true, stamp: 0,
      minX: x - radius, maxX: x + radius, minZ: z - radius, maxZ: z + radius,
    };
    this.add(collider, false);
    return collider;
  }

  private add(collider: Collider, dynamic: boolean): void {
    if (dynamic) {
      this.dynamic.push(collider);
      return;
    }
    this.colliders.push(collider);
    const minCellX = Math.floor(collider.minX / CELL_SIZE), maxCellX = Math.floor(collider.maxX / CELL_SIZE);
    const minCellZ = Math.floor(collider.minZ / CELL_SIZE), maxCellZ = Math.floor(collider.maxZ / CELL_SIZE);
    for (let x = minCellX; x <= maxCellX; x++) {
      for (let z = minCellZ; z <= maxCellZ; z++) {
        const key = `${x},${z}`;
        const list = this.grid.get(key) ?? [];
        list.push(collider);
        this.grid.set(key, list);
      }
    }
  }

  move(position: { x: number; y: number; z: number }, dx: number, dz: number, radius: number): void {
    position.x += dx;
    this.resolve(position, radius, true);
    position.z += dz;
    this.resolve(position, radius, false);
  }

  private resolve(position: { x: number; y: number; z: number }, radius: number, xAxis: boolean): void {
    const nearby = this.query(position.x, position.z, radius + 0.5);
    for (const c of nearby) {
      if (!c.enabled || position.y > c.maxY || position.y + 1.65 < c.minY) continue;
      if (c.kind === "circle") {
        const dx = position.x - c.x, dz = position.z - c.z;
        const minDistance = radius + c.radius;
        const distanceSq = dx * dx + dz * dz;
        if (distanceSq < minDistance * minDistance && distanceSq > 0.000001) {
          const distance = Math.sqrt(distanceSq);
          const push = minDistance - distance;
          position.x += (dx / distance) * push;
          position.z += (dz / distance) * push;
        }
        continue;
      }
      const closestX = Math.max(c.minX, Math.min(position.x, c.maxX));
      const closestZ = Math.max(c.minZ, Math.min(position.z, c.maxZ));
      const dx = position.x - closestX, dz = position.z - closestZ;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq >= radius * radius) continue;
      if (distanceSq > 0.000001) {
        const distance = Math.sqrt(distanceSq);
        const push = radius - distance;
        position.x += (dx / distance) * push;
        position.z += (dz / distance) * push;
      } else if (xAxis) {
        const left = Math.abs(position.x - c.minX), right = Math.abs(c.maxX - position.x);
        position.x = left < right ? c.minX - radius : c.maxX + radius;
      } else {
        const near = Math.abs(position.z - c.minZ), far = Math.abs(c.maxZ - position.z);
        position.z = near < far ? c.minZ - radius : c.maxZ + radius;
      }
    }
  }

  private query(x: number, z: number, radius: number): Collider[] {
    this.nearby.length = 0;
    this.queryId++;
    const minX = Math.floor((x - radius) / CELL_SIZE), maxX = Math.floor((x + radius) / CELL_SIZE);
    const minZ = Math.floor((z - radius) / CELL_SIZE), maxZ = Math.floor((z + radius) / CELL_SIZE);
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cz = minZ; cz <= maxZ; cz++) {
        const list = this.grid.get(`${cx},${cz}`);
        if (!list) continue;
        for (const c of list) {
          if (c.stamp === this.queryId) continue;
          c.stamp = this.queryId;
          this.nearby.push(c);
        }
      }
    }
    for (const c of this.dynamic) this.nearby.push(c);
    return this.nearby;
  }
}
