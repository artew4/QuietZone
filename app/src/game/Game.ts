import * as THREE from "three";
import { GameLoop } from "./engine";
import { Input } from "./input";
import { AudioSystem } from "./audio";
import { MaterialLibrary } from "./utils/materials";
import { LightingSystem } from "./systems/LightingSystem";
import { PhysicsSystem } from "./systems/PhysicsSystem";
import { InteractionSystem } from "./systems/InteractionSystem";
import { PerformanceMonitor } from "./systems/PerformanceMonitor";
import { PlayerController } from "./player/PlayerController";
import { World } from "./world/World";
import { QUALITY } from "./config";
import type { GameSnapshot, GameState } from "./types";

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private input: Input;
  private audio = new AudioSystem();
  private physics = new PhysicsSystem();
  private interactions = new InteractionSystem();
  private player: PlayerController;
  private world: World;
  private monitor: PerformanceMonitor;
  private loop: GameLoop;
  private state: GameState = "title";
  private time = 0;
  private playTime = 0;
  private lastRender = performance.now();
  private currentPrompt = "";
  private currentLocation = "";
  private hadPointerLock = false;
  private disposed = false;
  private listeners: Array<() => void> = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY.MAX_DPR));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.camera = new THREE.PerspectiveCamera(67, window.innerWidth / window.innerHeight, 0.06, 400);
    new LightingSystem(this.scene);
    const materials = new MaterialLibrary();
    this.world = new World(this.scene, materials, this.physics);
    this.input = new Input(canvas);
    this.player = new PlayerController(this.camera, this.input, this.physics);
    this.monitor = new PerformanceMonitor(this.renderer);
    this.registerInteractions();
    this.bindEvents();
    this.setTitleCamera();
    this.emitState();
    this.emit("muted", this.audio.muted);

    this.loop = new GameLoop({ update: (dt) => this.update(dt), render: () => this.render() });
    this.loop.start();
  }

  private onWindow(type: string, handler: EventListener): void {
    window.addEventListener(type, handler);
    this.listeners.push(() => window.removeEventListener(type, handler));
  }

  private bindEvents(): void {
    this.onWindow("quietzone:start", () => this.startPlaying());
    this.onWindow("quietzone:pause", () => this.pause());
    this.onWindow("quietzone:resume", () => this.resume());
    this.onWindow("quietzone:restart", () => this.restart());
    this.onWindow("quietzone:title", () => this.toTitle());
    this.onWindow("quietzone:summary", () => this.toSummary());
    this.onWindow("quietzone:mute", () => {
      const muted = this.audio.toggleMute();
      if (!muted && this.state !== "title") this.audio.startAmbience();
      this.emit("muted", muted);
    });
    this.onWindow("resize", () => this.resize());
    this.canvas.addEventListener("click", this.onCanvasClick);
    this.listeners.push(() => this.canvas.removeEventListener("click", this.onCanvasClick));
    document.addEventListener("pointerlockchange", this.onPointerLock);
    this.listeners.push(() => document.removeEventListener("pointerlockchange", this.onPointerLock));
  }

  private onCanvasClick = (): void => {
    if (this.state === "playing" && document.pointerLockElement !== this.canvas) this.lockPointer();
  };

  private onPointerLock = (): void => {
    if (document.pointerLockElement === this.canvas) {
      this.hadPointerLock = true;
    } else if (this.state === "playing" && this.hadPointerLock) {
      this.pause();
    }
  };

  private lockPointer(): void {
    try {
      const request = this.canvas.requestPointerLock();
      if (request && typeof request.catch === "function") request.catch(() => undefined);
    } catch { /* keyboard/touch exploration remains available without pointer lock */ }
  }

  private registerInteractions(): void {
    const garage = this.world.garage;
    this.interactions.add({
      id: "garage-door", position: garage.doorPosition, radius: 3.15,
      prompt: () => garage.isOpen ? "E — закрыть ворота гаража" : "E — открыть ворота гаража",
      enabled: () => true,
      interact: () => {
        const open = garage.toggleDoor();
        this.audio.sfx("door");
        this.toast(open ? "Гараж № 17 открыт. Здесь пахнет деревом и старой аппаратурой." : "Ворота гаража закрыты.");
      },
    });
    this.interactions.add({
      id: "oscilloscope", position: garage.workshop.oscilloscopePosition, radius: 2.25,
      prompt: () => garage.workshop.oscilloscopeEnabled ? "E — выключить осциллограф" : "E — включить осциллограф",
      enabled: () => garage.isOpen,
      interact: () => {
        const on = garage.workshop.toggleOscilloscope();
        this.audio.sfx("switch");
        this.toast(on ? "На экране снова появилась устойчивая синусоида." : "Осциллограф выключен.");
      },
    });
    this.interactions.add({
      id: "radio", position: garage.workshop.radioPosition, radius: 2.2,
      prompt: () => garage.workshop.radioEnabled ? "E — выключить радиоприёмник" : "E — включить радиоприёмник",
      enabled: () => garage.isOpen,
      interact: () => {
        const on = garage.workshop.toggleRadio();
        this.audio.sfx("switch");
        this.toast(on ? "В эфире короткий шум и едва слышный ритмичный сигнал." : "Радиоприёмник выключен.");
      },
    });
    this.interactions.add({
      id: "lamp", position: garage.workshop.lampPosition, radius: 2.1,
      prompt: () => garage.workshop.lampEnabled ? "E — выключить настольную лампу" : "E — включить настольную лампу",
      enabled: () => garage.isOpen,
      interact: () => {
        const on = garage.workshop.toggleLamp();
        this.audio.sfx("switch");
        this.toast(on ? "Тёплый круг света лёг на раскрытую тетрадь." : "Настольная лампа выключена.");
      },
    });
  }

  private startPlaying(): void {
    if (this.state !== "title" && this.state !== "summary") return;
    this.state = "playing";
    this.hadPointerLock = false;
    this.playTime = 0;
    this.player.reset();
    this.input.clearTransient();
    this.audio.startAmbience();
    this.audio.sfx("ui");
    this.emitState();
    this.lockPointer();
  }

  private restart(): void {
    this.world.garage.isOpen = false;
    this.world.garage.doorCollider.enabled = true;
    this.state = "summary";
    this.startPlaying();
  }

  private pause(): void {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.input.reset();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.emitState();
  }

  private resume(): void {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.hadPointerLock = false;
    this.input.clearTransient();
    this.audio.sfx("ui");
    this.emitState();
    this.lockPointer();
  }

  private toTitle(): void {
    this.state = "title";
    this.input.reset();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.setTitleCamera();
    this.emitState();
  }

  private toSummary(): void {
    if (this.state !== "paused" && this.state !== "playing") return;
    this.state = "summary";
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.emit("summaryData", { seconds: Math.round(this.playTime), location: this.world.getLocation(this.player.position) });
    this.emitState();
  }

  private setTitleCamera(): void {
    this.camera.position.set(40, 17, 47);
    this.camera.lookAt(-2, 3.5, 1);
  }

  private update(dt: number): void {
    if (this.disposed) return;
    this.time += dt;
    this.world.update(this.time, dt);

    if (this.state === "title") {
      if (this.input.consumeAction("Space")) this.startPlaying();
      else {
        this.camera.position.x = 40 + Math.sin(this.time * 0.09) * 1.6;
        this.camera.position.z = 47 + Math.cos(this.time * 0.07) * 1.1;
        this.camera.lookAt(-2, 3.5, 1);
      }
    } else if (this.state === "playing") {
      if (this.input.consumeAction("Escape")) { this.pause(); return; }
      this.playTime += dt;
      if (this.input.consumeAction("KeyE")) this.interactions.interact();
      this.player.update(dt, true);
      this.interactions.update(this.camera.position);
      const prompt = this.interactions.current?.prompt() ?? "";
      if (prompt !== this.currentPrompt) { this.currentPrompt = prompt; this.emit("interaction", prompt); }
      const location = this.world.getLocation(this.player.position);
      if (location !== this.currentLocation) {
        this.currentLocation = location;
        this.emit("location", location);
      }
    } else if (this.state === "paused") {
      if (this.input.consumeAction("Escape")) this.resume();
    } else if (this.state === "summary" && this.input.consumeAction("Space")) {
      this.restart();
    }
    this.audio.update(dt, this.world.isInsideLab(this.player.position), this.state === "playing" && this.player.moving, this.world.garage.workshop.radioEnabled);
  }

  private render(): void {
    const now = performance.now();
    const dt = Math.min(0.25, (now - this.lastRender) / 1000);
    this.lastRender = now;
    this.renderer.render(this.scene, this.camera);
    this.monitor.update(dt);
    window.__GAME_READY__ = true;
  }

  private resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  private emit(name: string, detail: unknown): void {
    window.dispatchEvent(new CustomEvent(`quietzone:${name}`, { detail }));
  }

  private emitState(): void { this.emit("state", this.state); }
  private toast(message: string): void { this.emit("toast", message); }

  getProbe(): { x: number; y: number; z: number } {
    return { x: this.player.position.x, y: this.player.position.y, z: this.player.position.z };
  }

  getSnapshot(): GameSnapshot {
    return {
      state: this.state, x: this.player.position.x, y: this.player.position.y, z: this.player.position.z,
      yaw: this.player.yaw, pitch: this.player.pitch, interaction: this.currentPrompt,
      location: this.currentLocation, garageOpen: this.world.garage.isOpen,
      oscilloscopeOn: this.world.garage.workshop.oscilloscopeEnabled,
      radioOn: this.world.garage.workshop.radioEnabled,
      lampOn: this.world.garage.workshop.lampEnabled,
      metrics: this.monitor.getMetrics(),
    };
  }

  debugTeleport(x: number, z: number, yaw = 0, pitch = 0): void {
    this.player.position.set(x, 0, z);
    this.player.velocity.set(0, 0, 0);
    this.player.yaw = yaw;
    this.player.pitch = pitch;
  }

  dispose(): void {
    this.disposed = true;
    this.loop.stop();
    this.listeners.forEach((off) => off());
    this.input.dispose();
    this.audio.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
          material.dispose();
        }
      }
    });
    this.renderer.dispose();
  }
}
