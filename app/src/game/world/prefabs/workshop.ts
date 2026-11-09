import * as THREE from "three";
import type { MaterialLibrary } from "../../utils/materials";
import { labelTexture } from "../../utils/materials";
import { cable, meshBox, meshCylinder, plane, rodBetween } from "../../utils/geometry";
import type { PhysicsSystem } from "../../systems/PhysicsSystem";
import { mulberry32, range } from "../../utils/random";

export interface Workshop {
  oscilloscopePosition: THREE.Vector3;
  radioPosition: THREE.Vector3;
  lampPosition: THREE.Vector3;
  oscilloscopeEnabled: boolean;
  radioEnabled: boolean;
  lampEnabled: boolean;
  toggleOscilloscope: () => boolean;
  toggleRadio: () => boolean;
  toggleLamp: () => boolean;
  update: (time: number) => void;
}

function createNotebookTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#d9cdaa"; ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(84,112,128,.22)"; ctx.lineWidth = 2;
  for (let y = 48; y < 512; y += 34) { ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(490, y); ctx.stroke(); }
  ctx.strokeStyle = "rgba(155,73,63,.35)"; ctx.beginPath(); ctx.moveTo(65, 0); ctx.lineTo(65, 512); ctx.stroke();
  ctx.fillStyle = "#384d58"; ctx.font = "italic 29px Georgia, serif";
  ctx.fillText("Эксперимент № 17", 90, 70);
  ctx.font = "italic 25px Georgia, serif";
  ctx.fillText("U(t) = U₀ sin(ωt + φ)", 95, 135);
  ctx.fillText("λ = 2πc / ω", 115, 190);
  ctx.fillText("∇ · E = ρ / ε₀", 98, 245);
  ctx.fillText("сигнал повторяется…", 95, 315);
  ctx.strokeStyle = "#455c64"; ctx.lineWidth = 3; ctx.beginPath();
  for (let x = 90; x < 430; x += 5) {
    const y = 400 + Math.sin(x * 0.055) * 34;
    if (x === 90) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createOscilloscope(m: MaterialLibrary): { group: THREE.Group; texture: THREE.CanvasTexture; ctx: CanvasRenderingContext2D; screenMaterial: THREE.MeshBasicMaterial } {
  const group = new THREE.Group();
  meshBox(group, [1.15, 0.7, 0.68], [0, 0, 0], m.dark, 0.07);
  meshBox(group, [1.05, 0.6, 0.055], [0, 0, 0.36], m.cream, 0.035);
  meshBox(group, [0.65, 0.43, 0.045], [-0.15, 0.035, 0.405], m.black, 0.04);
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const screenMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  plane(group, 0.57, 0.35, [-0.15, 0.035, 0.432], screenMaterial);
  for (let i = 0; i < 3; i++) {
    const knob = meshCylinder(group, [0.055, 0.055], 0.06, [0.36, 0.18 - i * 0.18, 0.42], i === 2 ? m.greenPaint : m.dark, 12);
    knob.rotation.x = Math.PI / 2;
  }
  for (let i = 0; i < 3; i++) {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), i === 0 ? m.lamp : m.screen);
    led.position.set(0.16 + i * 0.08, -0.24, 0.43);
    group.add(led);
  }
  meshBox(group, [0.38, 0.045, 0.06], [-0.15, -0.275, 0.42], m.dark);
  return { group, texture, ctx, screenMaterial };
}

function createRadio(m: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  meshBox(group, [0.85, 0.5, 0.4], [0, 0, 0], m.wood, 0.055);
  meshBox(group, [0.78, 0.42, 0.035], [0, 0, 0.22], m.cream, 0.025);
  for (let i = 0; i < 8; i++) meshBox(group, [0.025, 0.23, 0.02], [-0.29 + i * 0.055, -0.035, 0.245], m.dark);
  meshBox(group, [0.28, 0.12, 0.025], [0.19, 0.09, 0.245], m.glassWarm);
  for (const x of [0.12, 0.3]) {
    const knob = meshCylinder(group, [0.048, 0.048], 0.055, [x, -0.11, 0.25], m.dark, 12);
    knob.rotation.x = Math.PI / 2;
  }
  rodBetween(group, new THREE.Vector3(0.3, 0.25, 0), new THREE.Vector3(0.55, 1.05, -0.1), 0.012, m.metal, 6);
  return group;
}

function createMug(m: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  meshCylinder(group, [0.09, 0.075], 0.2, [0, 0.1, 0], m.cream, 16);
  meshCylinder(group, [0.073, 0.073], 0.005, [0, 0.202, 0], m.wood, 16);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.017, 6, 12, Math.PI * 1.65), m.cream);
  handle.position.set(0.085, 0.11, 0);
  handle.rotation.y = Math.PI / 2;
  group.add(handle);
  return group;
}

export function createWorkshop(parent: THREE.Group, m: MaterialLibrary, physics: PhysicsSystem, heroX: number, heroZ: number): Workshop {
  const group = new THREE.Group();
  group.position.set(heroX, 0, heroZ);
  parent.add(group);
  const random = mulberry32(1701);

  // Interior finishes: a warm, enclosed human-scale room.
  meshBox(group, [5.15, 0.08, 6.65], [0, 0.04, 0], m.concrete);
  meshBox(group, [5.05, 0.04, 2.5], [0, 0.095, 0.55], m.fabric);
  for (let i = 0; i < 9; i++) {
    meshBox(group, [4.85, 0.012, 0.055], [0, 0.122, -0.52 + i * 0.27], i % 2 ? m.ochrePaint : m.cream);
  }
  meshBox(group, [5.05, 0.6, 0.08], [0, 0.34, -3.28], m.wood);
  meshBox(group, [0.08, 0.6, 6.5], [-2.52, 0.34, 0], m.wood);

  // Old workbench: separate planks, legs, drawers and a worn top.
  const bench = new THREE.Group();
  bench.position.set(-0.35, 0, -2.25);
  group.add(bench);
  for (let i = 0; i < 4; i++) meshBox(bench, [3.75, 0.1, 0.22], [0, 0.96, -0.34 + i * 0.23], m.woodLight, 0.018);
  for (const x of [-1.65, 1.65]) {
    for (const z of [-0.32, 0.32]) meshBox(bench, [0.12, 0.93, 0.12], [x, 0.47, z], m.wood);
  }
  meshBox(bench, [0.85, 0.65, 0.65], [1.18, 0.58, 0], m.greenPaint);
  for (let i = 0; i < 3; i++) {
    meshBox(bench, [0.76, 0.17, 0.045], [1.18, 0.37 + i * 0.2, 0.35], m.greenPaint);
    meshBox(bench, [0.2, 0.025, 0.045], [1.18, 0.37 + i * 0.2, 0.385], m.metal);
  }
  physics.addBox(heroX - 0.35, heroZ - 2.25, 3.85, 1, 1.1);

  const oscilloscope = createOscilloscope(m);
  oscilloscope.group.position.set(-0.8, 1.38, -2.25);
  group.add(oscilloscope.group);
  const radio = createRadio(m);
  radio.position.set(0.48, 1.27, -2.25);
  group.add(radio);

  // Notebook, pencil, mug and small component boxes.
  const notebookMaterial = new THREE.MeshStandardMaterial({ map: createNotebookTexture(), roughness: 1, side: THREE.DoubleSide });
  const notebook = plane(group, 0.62, 0.75, [0.05, 1.035, -1.98], notebookMaterial);
  notebook.rotation.x = -Math.PI / 2;
  notebook.rotation.z = -0.15;
  const pencil = meshCylinder(group, [0.012, 0.012], 0.52, [0.34, 1.05, -1.92], m.ochrePaint, 7);
  pencil.rotation.z = Math.PI / 2;
  pencil.rotation.y = 0.3;
  const mug = createMug(m);
  mug.position.set(-1.65, 1.03, -1.98);
  group.add(mug);
  for (let i = 0; i < 4; i++) {
    meshBox(group, [0.34, 0.18, 0.28], [1.05 + (i % 2) * 0.37, 1.08 + Math.floor(i / 2) * 0.17, -2.25], i % 2 ? m.wood : m.bluePaint, 0.025);
  }

  // Soldering station, coiled wire and hand tools.
  meshBox(group, [0.45, 0.22, 0.36], [-1.55, 1.12, -2.42], m.bluePaint, 0.04);
  meshBox(group, [0.22, 0.08, 0.025], [-1.55, 1.15, -2.225], m.screen);
  cable(group, [new THREE.Vector3(-1.4, 1.05, -2.3), new THREE.Vector3(-1.25, 1.04, -1.85), new THREE.Vector3(-0.95, 1.04, -1.8)], 0.014, m.black);
  rodBetween(group, new THREE.Vector3(-1.02, 1.08, -1.82), new THREE.Vector3(-0.75, 1.08, -1.7), 0.025, m.dark);
  for (let i = 0; i < 4; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.14 + i * 0.008, 0.012, 5, 18), i % 2 ? m.rust : m.dark);
    coil.position.set(1.55, 1.05 + i * 0.018, -1.95);
    coil.rotation.x = -Math.PI / 2;
    group.add(coil);
  }

  // Desk lamp with a real warm light pool.
  meshCylinder(group, [0.18, 0.22], 0.055, [-1.65, 1.05, -2.55], m.dark, 16);
  rodBetween(group, new THREE.Vector3(-1.65, 1.08, -2.55), new THREE.Vector3(-1.5, 1.75, -2.5), 0.025, m.dark);
  rodBetween(group, new THREE.Vector3(-1.5, 1.75, -2.5), new THREE.Vector3(-1.2, 1.95, -2.25), 0.025, m.dark);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.32, 16, 1, true), m.greenPaint);
  shade.position.set(-1.18, 1.83, -2.22);
  shade.rotation.x = -0.5;
  group.add(shade);
  const deskBulb = new THREE.PointLight(0xffbf72, 7, 4, 2);
  deskBulb.position.set(-1.15, 1.72, -2.05);
  group.add(deskBulb);
  const deskGlow = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), m.lamp);
  deskGlow.position.copy(deskBulb.position);
  group.add(deskGlow);

  // Wall shelves, books and labelled component boxes.
  for (const y of [1.35, 2.05]) {
    meshBox(group, [0.38, 0.09, 2.75], [-2.27, y, -0.85], m.woodLight);
    for (const z of [-1.95, 0.25]) rodBetween(group, new THREE.Vector3(-2.45, y - 0.4, z), new THREE.Vector3(-2.08, y, z), 0.025, m.dark);
  }
  const bookMaterials = [m.redPaint, m.greenPaint, m.bluePaint, m.ochrePaint, m.cream];
  for (let i = 0; i < 15; i++) {
    const height = range(random, 0.32, 0.53);
    const book = meshBox(group, [0.24, height, 0.09 + random() * 0.06], [-2.03, 1.4 + height / 2, -1.85 + i * 0.14], bookMaterials[i % bookMaterials.length]);
    book.rotation.x = i > 11 ? 0.12 : 0;
  }
  for (let i = 0; i < 6; i++) {
    meshBox(group, [0.3, 0.24, 0.36], [-2.03, 2.22, -1.8 + i * 0.4], i % 2 ? m.wood : m.concreteLight, 0.025);
    meshBox(group, [0.02, 0.07, 0.18], [-1.865, 2.23, -1.8 + i * 0.4], m.paper);
  }

  // Pegboard and recognizable hand-tool silhouettes.
  meshBox(group, [0.07, 1.1, 1.8], [2.48, 1.65, -1.65], m.wood);
  for (let i = 0; i < 5; i++) {
    rodBetween(group, new THREE.Vector3(2.42, 1.25 + i * 0.18, -2.25 + i * 0.28), new THREE.Vector3(2.35, 1.65 + i * 0.12, -2.2 + i * 0.28), 0.025, m.metal);
  }
  meshBox(group, [0.08, 0.18, 0.42], [2.33, 1.82, -1.3], m.redPaint);

  // Old sofa along the right wall, with cushions and a folded blanket.
  const sofa = new THREE.Group();
  sofa.position.set(1.83, 0, 0.7);
  sofa.rotation.y = -Math.PI / 2;
  group.add(sofa);
  meshBox(sofa, [2.05, 0.38, 0.82], [0, 0.37, 0], m.fabric, 0.1);
  meshBox(sofa, [2.05, 0.75, 0.22], [0, 0.72, -0.37], m.fabric, 0.09);
  for (const x of [-0.98, 0.98]) meshBox(sofa, [0.18, 0.58, 0.88], [x, 0.48, 0], m.wood, 0.05);
  meshBox(sofa, [0.82, 0.15, 0.65], [-0.46, 0.63, 0.03], m.ochrePaint, 0.07);
  meshBox(sofa, [0.82, 0.15, 0.65], [0.46, 0.63, 0.03], m.greenPaint, 0.07);
  physics.addBox(heroX + 1.83, heroZ + 0.7, 1, 2.15, 1.1);

  // Electric panel, heater and kettle.
  meshBox(group, [0.65, 0.95, 0.18], [1.75, 1.65, -3.23], m.metal, 0.045);
  meshBox(group, [0.52, 0.78, 0.035], [1.75, 1.65, -3.12], m.concreteLight);
  for (let i = 0; i < 4; i++) meshBox(group, [0.09, 0.16, 0.055], [1.57 + i * 0.12, 1.75, -3.08], m.dark);
  cable(group, [new THREE.Vector3(1.75, 2.12, -3.22), new THREE.Vector3(1.75, 2.65, -3.22), new THREE.Vector3(-1.5, 2.65, -3.22)], 0.025, m.black);
  meshBox(group, [0.6, 0.75, 0.28], [-2.22, 0.47, 1.9], m.cream, 0.06);
  for (let i = 0; i < 7; i++) meshBox(group, [0.045, 0.58, 0.31], [-2.45 + i * 0.075, 0.47, 1.9], m.dark);
  const kettle = new THREE.Group();
  kettle.position.set(-1.45, 0.18, 1.9);
  group.add(kettle);
  meshCylinder(kettle, [0.18, 0.22], 0.35, [0, 0.2, 0], m.metal, 14);
  const kettleHandle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 14, Math.PI), m.dark);
  kettleHandle.position.y = 0.36;
  kettle.add(kettleHandle);
  rodBetween(kettle, new THREE.Vector3(0.15, 0.22, 0), new THREE.Vector3(0.35, 0.32, 0), 0.045, m.metal);

  // Ceiling light, calendar and wall clock.
  cable(group, [new THREE.Vector3(0, 3.05, 0), new THREE.Vector3(0, 2.65, 0)], 0.018, m.black);
  const ceilingShade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.26, 18, 1, true), m.cream);
  ceilingShade.position.set(0, 2.58, 0);
  group.add(ceilingShade);
  const ceilingBulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), m.lamp);
  ceilingBulb.position.set(0, 2.47, 0);
  group.add(ceilingBulb);
  const ceilingLight = new THREE.PointLight(0xffbd72, 26, 9, 2);
  ceilingLight.position.set(0, 2.38, 0);
  group.add(ceilingLight);
  const calendarMat = new THREE.MeshStandardMaterial({ map: labelTexture("ОКТЯБРЬ", "#d8cba8", "#7a4b3f", "2003"), roughness: 1 });
  plane(group, 0.65, 0.85, [0.9, 1.95, -3.335], calendarMat);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.29, 24), m.cream);
  clock.position.set(-0.05, 2.15, -3.34);
  group.add(clock);
  rodBetween(group, new THREE.Vector3(-0.05, 2.15, -3.31), new THREE.Vector3(-0.05, 2.34, -3.31), 0.012, m.dark, 5);
  rodBetween(group, new THREE.Vector3(-0.05, 2.15, -3.30), new THREE.Vector3(0.1, 2.08, -3.30), 0.012, m.dark, 5);

  const workshop: Workshop = {
    oscilloscopePosition: new THREE.Vector3(heroX - 0.8, 1.35, heroZ - 1.75),
    radioPosition: new THREE.Vector3(heroX + 0.48, 1.25, heroZ - 1.75),
    lampPosition: new THREE.Vector3(heroX - 1.2, 1.5, heroZ - 1.85),
    oscilloscopeEnabled: true,
    radioEnabled: false,
    lampEnabled: true,
    toggleOscilloscope: () => (workshop.oscilloscopeEnabled = !workshop.oscilloscopeEnabled),
    toggleRadio: () => (workshop.radioEnabled = !workshop.radioEnabled),
    toggleLamp: () => {
      workshop.lampEnabled = !workshop.lampEnabled;
      deskBulb.visible = workshop.lampEnabled;
      deskGlow.visible = workshop.lampEnabled;
      return workshop.lampEnabled;
    },
    update: (time: number) => {
      const ctx = oscilloscope.ctx;
      ctx.fillStyle = workshop.oscilloscopeEnabled ? "#071b13" : "#101512";
      ctx.fillRect(0, 0, 256, 160);
      ctx.strokeStyle = workshop.oscilloscopeEnabled ? "rgba(70,150,91,.22)" : "rgba(70,80,70,.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= 256; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 160); ctx.stroke(); }
      for (let y = 0; y <= 160; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); }
      if (workshop.oscilloscopeEnabled) {
        ctx.strokeStyle = "#79f49a"; ctx.lineWidth = 3;
        ctx.shadowColor = "#55ee88"; ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let x = 0; x < 256; x += 2) {
          const y = 80 + Math.sin(x * 0.065 + time * 2.6) * 42 * (0.92 + Math.sin(time * 0.7) * 0.08);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = "#8fd9a2"; ctx.font = "11px monospace"; ctx.fillText("50 Hz  2.0 V", 9, 15);
      }
      oscilloscope.texture.needsUpdate = true;
    },
  };
  workshop.update(0);
  return workshop;
}
