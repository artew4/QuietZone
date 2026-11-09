import { Game } from "./Game";
import type { GameSnapshot, GameState } from "./types";

declare global {
  interface Window {
    __gameProbe?: () => { x: number; y: number; z: number };
    __GAME_READY__?: boolean;
    __gameDebug?: {
      snapshot: () => GameSnapshot;
      teleport: (x: number, z: number, yaw?: number, pitch?: number) => void;
      command: (command: "start" | "pause" | "resume" | "restart" | "title" | "summary" | "mute") => void;
      interact: () => void;
    };
  }
}

let session: Game | null = null;

export function gameCommand(command: "start" | "pause" | "resume" | "restart" | "title" | "summary" | "mute"): void {
  window.dispatchEvent(new Event(`quietzone:${command}`));
}

export function startGame(canvas: HTMLCanvasElement): void {
  stopGame();
  session = new Game(canvas);
  window.__gameProbe = () => session?.getProbe() ?? { x: 0, y: 0, z: 0 };
  window.__gameDebug = {
    snapshot: () => session!.getSnapshot(),
    teleport: (x, z, yaw, pitch) => session?.debugTeleport(x, z, yaw, pitch),
    command: (command) => gameCommand(command),
    interact: () => window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE" })),
  };
}

export function stopGame(): void {
  session?.dispose();
  session = null;
  delete window.__gameProbe;
  delete window.__gameDebug;
  window.__GAME_READY__ = false;
}

export type { GameState };
