import * as THREE from "three";
import { PALETTE } from "../config";
import { mulberry32, range } from "./random";

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 4;
  return texture;
}

function noiseSurface(base: string, seed: number, kind: "plaster" | "concrete" | "asphalt" | "metal" | "wood"): THREE.CanvasTexture {
  return canvasTexture(256, (ctx, size) => {
    const random = mulberry32(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    if (kind === "wood") {
      for (let y = 0; y < size; y += 32) {
        ctx.fillStyle = y % 64 === 0 ? "rgba(40,20,8,.13)" : "rgba(255,220,150,.06)";
        ctx.fillRect(0, y, size, 2);
        for (let i = 0; i < 10; i++) {
          ctx.strokeStyle = `rgba(55,29,12,${range(random, 0.025, 0.11)})`;
          ctx.beginPath();
          const sy = y + random() * 30;
          ctx.moveTo(0, sy);
          ctx.bezierCurveTo(70, sy + range(random, -4, 4), 160, sy + range(random, -4, 4), size, sy);
          ctx.stroke();
        }
      }
    }
    if (kind === "metal") {
      for (let i = 0; i < 45; i++) {
        ctx.fillStyle = `rgba(92,43,23,${range(random, 0.025, 0.15)})`;
        ctx.beginPath();
        ctx.ellipse(random() * size, random() * size, range(random, 2, 15), range(random, 1, 8), random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let x = 0; x < size; x += 24) {
        ctx.fillStyle = "rgba(255,255,255,.045)";
        ctx.fillRect(x, 0, 2, size);
        ctx.fillStyle = "rgba(0,0,0,.05)";
        ctx.fillRect(x + 12, 0, 2, size);
      }
    }
    const count = kind === "asphalt" ? 7200 : 3000;
    for (let i = 0; i < count; i++) {
      const light = random() > 0.52;
      const alpha = kind === "asphalt" ? range(random, 0.025, 0.11) : range(random, 0.012, 0.055);
      ctx.fillStyle = light ? `rgba(255,245,220,${alpha})` : `rgba(35,29,24,${alpha})`;
      const s = kind === "asphalt" ? range(random, 0.5, 2.2) : range(random, 0.5, 3.5);
      ctx.fillRect(random() * size, random() * size, s, s);
    }
    if (kind === "plaster") {
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = `rgba(70,61,45,${range(random, 0.015, 0.05)})`;
        ctx.beginPath();
        ctx.ellipse(random() * size, random() * size, range(random, 8, 35), range(random, 2, 14), random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(65,53,42,.15)";
      ctx.lineWidth = 0.7;
      for (let i = 0; i < 8; i++) {
        let x = random() * size, y = random() * size;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let j = 0; j < 4; j++) { x += range(random, -6, 7); y += range(random, 4, 13); ctx.lineTo(x, y); }
        ctx.stroke();
      }
    }
    if (kind === "asphalt") {
      ctx.strokeStyle = "rgba(22,25,24,.35)";
      ctx.lineWidth = 1.1;
      for (let i = 0; i < 9; i++) {
        let x = random() * size, y = random() * size;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let j = 0; j < 6; j++) { x += range(random, -8, 8); y += range(random, 3, 12); ctx.lineTo(x, y); }
        ctx.stroke();
      }
    }
  }, kind === "wood" ? 2 : 3, kind === "wood" ? 2 : 3);
}

function brickTexture(base: string, mortar: string, seed: number): THREE.CanvasTexture {
  return canvasTexture(512, (ctx, size) => {
    const random = mulberry32(seed);
    ctx.fillStyle = mortar; ctx.fillRect(0, 0, size, size);
    const bw = 64, bh = 28;
    for (let row = 0; row < Math.ceil(size / bh); row++) {
      const offset = row % 2 ? -bw / 2 : 0;
      for (let x = offset; x < size; x += bw) {
        const v = Math.floor(range(random, -14, 15));
        const color = new THREE.Color(base);
        color.offsetHSL(range(random, -0.012, 0.012), range(random, -0.03, 0.03), v / 255);
        ctx.fillStyle = `#${color.getHexString()}`;
        ctx.fillRect(x + 2, row * bh + 2, bw - 4, bh - 4);
        ctx.fillStyle = "rgba(255,220,185,.045)";
        ctx.fillRect(x + 3, row * bh + 3, bw - 6, 2);
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = `rgba(50,25,18,${range(random, 0.015, 0.06)})`;
          ctx.fillRect(x + random() * bw, row * bh + random() * bh, range(random, 1, 5), 1);
        }
      }
    }
  }, 3, 2);
}

function birchTexture(): THREE.CanvasTexture {
  return canvasTexture(256, (ctx, size) => {
    const random = mulberry32(712);
    ctx.fillStyle = "#d8d3bd"; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(39,42,37,${range(random, 0.25, 0.72)})`;
      const y = random() * size;
      ctx.fillRect(random() * size, y, range(random, 4, 28), range(random, 1, 4));
    }
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(70,65,50,${range(random, 0.02, 0.09)})`;
      ctx.fillRect(random() * size, random() * size, 1, range(random, 1, 6));
    }
  }, 2, 3);
}

export function labelTexture(text: string, background = "#e2d7b9", color = "#383d36", subtitle = ""): THREE.CanvasTexture {
  return canvasTexture(512, (ctx, size) => {
    ctx.fillStyle = background; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(40,40,30,.45)"; ctx.lineWidth = 10; ctx.strokeRect(14, 14, size - 28, size - 28);
    ctx.fillStyle = color;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const fontSize = text.length > 20 ? 43 : text.length > 10 ? 56 : 100;
    ctx.font = `700 ${fontSize}px Arial, sans-serif`;
    ctx.fillText(text, size / 2, subtitle ? size * 0.43 : size / 2, size - 55);
    if (subtitle) {
      ctx.font = "500 32px Arial, sans-serif";
      ctx.fillText(subtitle, size / 2, size * 0.64, size - 70);
    }
    const random = mulberry32(text.length * 171);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(55,43,28,${range(random, 0.01, 0.06)})`;
      ctx.fillRect(random() * size, random() * size, range(random, 1, 4), range(random, 1, 4));
    }
  });
}

export class MaterialLibrary {
  readonly brickRed = new THREE.MeshStandardMaterial({ map: brickTexture("#a96750", "#b6a68e", 14), roughness: 0.96 });
  readonly brickDark = new THREE.MeshStandardMaterial({ map: brickTexture("#80584a", "#9b8e7b", 27), roughness: 0.98 });
  readonly plasterYellow = new THREE.MeshStandardMaterial({ map: noiseSurface("#c9b580", 32, "plaster"), roughness: 0.96 });
  readonly plasterGreen = new THREE.MeshStandardMaterial({ map: noiseSurface("#7f907b", 48, "plaster"), roughness: 0.95 });
  readonly concrete = new THREE.MeshStandardMaterial({ map: noiseSurface("#9f9b90", 72, "concrete"), roughness: 0.98 });
  readonly concreteLight = new THREE.MeshStandardMaterial({ map: noiseSurface("#c0b9a5", 73, "concrete"), roughness: 0.96 });
  readonly asphalt = new THREE.MeshStandardMaterial({ map: noiseSurface("#555852", 84, "asphalt"), roughness: 1 });
  readonly wood = new THREE.MeshStandardMaterial({ map: noiseSurface("#79563a", 92, "wood"), roughness: 0.9 });
  readonly woodLight = new THREE.MeshStandardMaterial({ map: noiseSurface("#a27a4c", 94, "wood"), roughness: 0.88 });
  readonly metal = new THREE.MeshStandardMaterial({ map: noiseSurface("#616a65", 102, "metal"), roughness: 0.72, metalness: 0.45 });
  readonly rust = new THREE.MeshStandardMaterial({ map: noiseSurface("#7b4e39", 106, "metal"), roughness: 0.88, metalness: 0.25 });
  readonly birch = new THREE.MeshStandardMaterial({ map: birchTexture(), roughness: 1 });
  readonly roof = new THREE.MeshStandardMaterial({ map: noiseSurface("#5b625d", 112, "metal"), roughness: 0.8, metalness: 0.35 });
  readonly dark = new THREE.MeshStandardMaterial({ color: 0x2e3432, roughness: 0.83, metalness: 0.25 });
  readonly black = new THREE.MeshStandardMaterial({ color: 0x191d1c, roughness: 0.75 });
  readonly cream = new THREE.MeshStandardMaterial({ color: PALETTE.cream, roughness: 0.86 });
  readonly whitePaint = new THREE.MeshStandardMaterial({ color: 0xd8d2bd, roughness: 0.88 });
  readonly greenPaint = new THREE.MeshStandardMaterial({ color: 0x526d5b, roughness: 0.83, metalness: 0.1 });
  readonly bluePaint = new THREE.MeshStandardMaterial({ color: 0x6f8c94, roughness: 0.82, metalness: 0.15 });
  readonly ochrePaint = new THREE.MeshStandardMaterial({ color: 0xb08b52, roughness: 0.85, metalness: 0.1 });
  readonly redPaint = new THREE.MeshStandardMaterial({ color: 0x8c4e3e, roughness: 0.88, metalness: 0.12 });
  readonly sand = new THREE.MeshStandardMaterial({ color: 0xc4a874, roughness: 1 });
  readonly soil = new THREE.MeshStandardMaterial({ color: 0x5e6147, roughness: 1 });
  readonly lawn = new THREE.MeshStandardMaterial({ map: noiseSurface("#77784f", 205, "plaster"), roughness: 1 });
  readonly grass = new THREE.MeshStandardMaterial({ color: 0x6f744b, roughness: 1, side: THREE.DoubleSide });
  readonly leavesGold = new THREE.MeshStandardMaterial({ color: 0xc18a42, roughness: 0.95, flatShading: true });
  readonly leavesYellow = new THREE.MeshStandardMaterial({ color: 0xd1aa58, roughness: 0.95, flatShading: true });
  readonly leavesGreen = new THREE.MeshStandardMaterial({ color: 0x7c8551, roughness: 0.95, flatShading: true });
  readonly glass = new THREE.MeshStandardMaterial({ color: 0x769197, roughness: 0.3, metalness: 0.18 });
  readonly glassWarm = new THREE.MeshStandardMaterial({ color: 0xffc77a, emissive: 0xffa64d, emissiveIntensity: 0.75, roughness: 0.45 });
  readonly lamp = new THREE.MeshStandardMaterial({ color: 0xffd89c, emissive: 0xffb85f, emissiveIntensity: 2.1, roughness: 0.5 });
  readonly screen = new THREE.MeshStandardMaterial({ color: 0x183a2d, emissive: 0x1c773f, emissiveIntensity: 0.55, roughness: 0.45 });
  readonly paper = new THREE.MeshStandardMaterial({ color: 0xd8cba8, roughness: 1, side: THREE.DoubleSide });
  readonly fabric = new THREE.MeshStandardMaterial({ color: 0x7b4d3e, roughness: 1 });
  readonly water = new THREE.MeshStandardMaterial({ color: 0x657c7b, roughness: 0.18, metalness: 0.35, transparent: true, opacity: 0.72 });
}
