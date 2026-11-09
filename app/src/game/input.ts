import { INPUT_CONFIG } from "./config";

const KEYMAP: Record<string, ["moveX" | "moveZ", 1 | -1]> = {
  KeyW: ["moveZ", 1], ArrowUp: ["moveZ", 1],
  KeyS: ["moveZ", -1], ArrowDown: ["moveZ", -1],
  KeyA: ["moveX", -1], ArrowLeft: ["moveX", -1],
  KeyD: ["moveX", 1], ArrowRight: ["moveX", 1],
};

export class Input {
  moveX = 0;
  moveZ = 0;
  private held = new Set<string>();
  private actions = new Set<string>();
  private yawDelta = 0;
  private pitchDelta = 0;
  private unsubscribe: Array<() => void> = [];

  constructor(private target: HTMLElement) {
    const on = <T extends Event>(el: Window | Document | HTMLElement, type: string, fn: (event: T) => void, options?: AddEventListenerOptions) => {
      const handler = fn as EventListener;
      el.addEventListener(type, handler, options);
      this.unsubscribe.push(() => el.removeEventListener(type, handler, options));
    };
    on<KeyboardEvent>(window, "keydown", (event) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      if (KEYMAP[event.code]) this.held.add(event.code);
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") this.held.add(event.code);
      if (!event.repeat) this.actions.add(event.code);
      this.recompute();
    });
    on<KeyboardEvent>(window, "keyup", (event) => {
      this.held.delete(event.code);
      this.recompute();
    });
    on(window, "blur", () => this.reset());
    on(document, "visibilitychange", () => { if (document.hidden) this.reset(); });
    on<MouseEvent>(window, "mousemove", (event) => {
      if (document.pointerLockElement !== this.target) return;
      this.yawDelta -= event.movementX * INPUT_CONFIG.MOUSE_SENS_X;
      this.pitchDelta -= event.movementY * INPUT_CONFIG.MOUSE_SENS_Y;
    });
    on<TouchEvent>(target, "contextmenu", (event) => event.preventDefault());
  }

  private recompute(): void {
    let x = 0, z = 0;
    for (const code of this.held) {
      const mapping = KEYMAP[code];
      if (!mapping) continue;
      if (mapping[0] === "moveX") x += mapping[1]; else z += mapping[1];
    }
    this.moveX = Math.max(-1, Math.min(1, x));
    this.moveZ = Math.max(-1, Math.min(1, z));
  }

  consumeLook(): { yaw: number; pitch: number } {
    const result = { yaw: this.yawDelta, pitch: this.pitchDelta };
    this.yawDelta = this.pitchDelta = 0;
    return result;
  }

  consumeAction(code: string): boolean {
    const result = this.actions.has(code);
    this.actions.delete(code);
    return result;
  }

  isDown(code: string): boolean { return this.held.has(code); }

  clearTransient(): void { this.actions.clear(); this.consumeLook(); }

  reset(): void {
    this.held.clear(); this.actions.clear(); this.moveX = this.moveZ = 0;
    this.yawDelta = this.pitchDelta = 0;
  }

  dispose(): void {
    this.unsubscribe.forEach((off) => off());
    this.unsubscribe = [];
    this.reset();
  }
}
