import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DIST = join(ROOT, "dist");
const SHOTS = join(ROOT, "verification-shots");
mkdirSync(SHOTS, { recursive: true });
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".wasm": "application/wasm" };
const server = createServer(async (req, res) => {
  try {
    const raw = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    const file = resolve(DIST, "." + decodeURIComponent(raw));
    if (file !== DIST && !file.startsWith(DIST + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const executablePath = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch({
  executablePath,
  headless: process.env.HEADED !== "1",
  args: executablePath ? ["--use-angle=metal"] : [],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.stack || String(error)));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const snapshot = () => page.evaluate(() => window.__gameDebug.snapshot());
const teleport = async (x, z, yaw = 0, pitch = 0) => {
  await page.evaluate(({ x, z, yaw, pitch }) => window.__gameDebug.teleport(x, z, yaw, pitch), { x, z, yaw, pitch });
  await page.waitForTimeout(140);
};
const hold = async (key, ms) => {
  await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(100);
};
const command = (name) => page.evaluate((name) => window.__gameDebug.command(name), name);

try {
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__GAME_READY__ === true);
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(SHOTS, "full-01-title.png") });

  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  assert((await snapshot()).state === "playing", "Space did not start the game");

  // All four movement directions from an unobstructed pose.
  let before = await snapshot(); await hold("KeyW", 300); let after = await snapshot();
  assert(after.z < before.z - 0.1, "W is not forward");
  await teleport(0, 30); before = await snapshot(); await hold("KeyS", 300); after = await snapshot();
  assert(after.z > before.z + 0.1, "S is not backward");
  await teleport(0, 30); before = await snapshot(); await hold("KeyA", 300); after = await snapshot();
  assert(after.x < before.x - 0.1, "A is not left");
  await teleport(0, 30); before = await snapshot(); await hold("KeyD", 300); after = await snapshot();
  assert(after.x > before.x + 0.1, "D is not right");

  // Closed door and solid residential building collision.
  await teleport(0, 28.3); await hold("KeyW", 1400); after = await snapshot();
  assert(after.z > 25.55, `Player crossed closed garage door: z=${after.z}`);
  await teleport(-27, -12); await hold("KeyW", 1400); after = await snapshot();
  assert(after.z > -14.75, `Player crossed residential wall: z=${after.z}`);

  // Door interaction and an actual walk through the opening.
  await teleport(0, 27.5); await page.waitForTimeout(200);
  assert((await snapshot()).interaction.includes("открыть"), "Garage open prompt is missing");
  await page.keyboard.press("KeyE"); await page.waitForTimeout(1400);
  assert((await snapshot()).garageOpen === true, "Garage did not open");
  await page.screenshot({ path: join(SHOTS, "full-02-open-garage.png") });
  await hold("KeyW", 1400); after = await snapshot();
  assert(after.z < 25, `Player could not walk into garage: z=${after.z}`);

  await teleport(-0.8, 22.3, 0, -0.12); await page.waitForTimeout(250);
  assert((await snapshot()).interaction.includes("осциллограф"), "Oscilloscope prompt is missing");
  await page.screenshot({ path: join(SHOTS, "full-03-laboratory.png") });
  await page.keyboard.press("KeyE"); await page.waitForTimeout(180);
  assert((await snapshot()).oscilloscopeOn === false, "Oscilloscope did not switch off");
  await page.keyboard.press("KeyE"); await page.waitForTimeout(180);
  assert((await snapshot()).oscilloscopeOn === true, "Oscilloscope did not switch back on");

  await teleport(0.48, 22.0, 0, -0.1);
  assert((await snapshot()).interaction.includes("радиоприёмник"), "Radio prompt is missing");
  await page.keyboard.press("KeyE"); await page.waitForTimeout(180);
  assert((await snapshot()).radioOn === true, "Radio did not switch on");
  await page.keyboard.press("KeyE"); await page.waitForTimeout(180);
  assert((await snapshot()).radioOn === false, "Radio did not switch off");

  await teleport(-1.5, 21.4, 0, -0.12);
  assert((await snapshot()).interaction.includes("ламп"), "Desk lamp prompt is missing");
  await page.keyboard.press("KeyE"); await page.waitForTimeout(180);
  assert((await snapshot()).lampOn === false, "Lamp did not switch off");
  await page.keyboard.press("KeyE"); await page.waitForTimeout(180);
  assert((await snapshot()).lampOn === true, "Lamp did not switch back on");

  await teleport(3, 4, 0, 0); await page.waitForTimeout(300);
  await page.screenshot({ path: join(SHOTS, "full-04-courtyard.png") });

  // Real UI controls: pause, summary, restart, mute and title.
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  await page.waitForTimeout(150);
  assert((await snapshot()).state === "paused", "Pause button failed");
  await page.getByRole("button", { name: "Завершить прогулку" }).click();
  await page.waitForTimeout(150);
  assert((await snapshot()).state === "summary", "Summary transition failed");
  await page.screenshot({ path: join(SHOTS, "full-05-summary.png") });
  await page.getByRole("button", { name: "Ещё одна прогулка" }).click();
  await page.waitForTimeout(200);
  assert((await snapshot()).state === "playing", "Restart button failed");
  await page.getByRole("button", { name: "Выключить звук" }).click();
  await page.getByRole("button", { name: "Включить звук" }).click();
  await command("pause");
  await page.getByRole("button", { name: "Вернуться на главный экран" }).click();
  await page.waitForTimeout(150);
  assert((await snapshot()).state === "title", "Return to title failed");

  await page.setViewportSize({ width: 960, height: 600 });
  await page.waitForTimeout(200);
  assert(errors.length === 0, `Browser errors:\n${errors.join("\n")}`);
  const metrics = (await snapshot()).metrics;
  console.log(`FULL VERIFY OK: controls/collisions/door/instruments/UI/resize/console passed. Metrics: ${JSON.stringify(metrics)}`);
} finally {
  await browser.close();
  server.close();
}
