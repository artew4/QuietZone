import * as THREE from "three";
import type { Interactable } from "../types";

export class InteractionSystem {
  private items: Interactable[] = [];
  private _current: Interactable | null = null;

  get current(): Interactable | null { return this._current; }

  add(item: Interactable): void { this.items.push(item); }

  update(position: THREE.Vector3): void {
    let nearest: Interactable | null = null;
    let nearestDistance = Infinity;
    for (const item of this.items) {
      if (!item.enabled()) continue;
      const distance = item.position.distanceToSquared(position);
      if (distance <= item.radius * item.radius && distance < nearestDistance) {
        nearest = item;
        nearestDistance = distance;
      }
    }
    this._current = nearest;
  }

  interact(): boolean {
    if (!this._current) return false;
    this._current.interact();
    this._current = null;
    return true;
  }
}
