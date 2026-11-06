// Screenshot halaman lewat Chrome headless (protokol DevTools, WebSocket bawaan Node 22+).
// Pakai: node scripts/showcase/capture.mjs <outDir> <username> <password> <spec.json>
// Butuh dev server di http://localhost:3000 (atau SHOWCASE_BASE_URL) dengan login lokal aktif.
// Spec: { scale, public: [shot], private: [shot] }, shot = { path, file, width, height, theme?, fullPage? }.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const [outDir, username, password, specPath] = process.argv.slice(2);
if (!outDir || !username || !password || !specPath) {
  console.error("Usage: node scripts/showcase/capture.mjs <outDir> <username> <password> <spec.json>");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const BASE = process.env.SHOWCASE_BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DPR = Number(spec.scale ?? 1);
const PORT = 9333;
const profileDir = join(tmpdir(), `act-showcase-${process.pid}`);
mkdirSync(outDir, { recursive: true });

const chrome = spawn(
  CHROME,
  ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profileDir}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "about:blank"],
  { stdio: "ignore" }
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function target() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((entry) => entry.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome belum siap.
    }
    await sleep(200);
  }
  throw new Error("Chrome did not start");
}

const ws = new WebSocket(await target());
await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
let nextId = 1;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) =>
    pending.set(id, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)))
  );
}
async function evaluate(expression) {
  const res = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  return res.result?.value;
}
async function settle(ms = 1200) {
  for (let i = 0; i < 60; i++) {
    if ((await evaluate("document.readyState")) === "complete") break;
    await sleep(200);
  }
  await evaluate("document.fonts ? document.fonts.ready.then(() => true) : true");
  await sleep(ms);
}
async function viewport(width, height, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: DPR, mobile });
}
async function go(path) {
  await send("Page.navigate", { url: `${BASE}${path}` });
  await sleep(400);
  await settle();
}
// Tema per shot lewat localStorage (dibaca skrip awal app/layout.tsx sebelum render). Gelap adalah bawaan;
// "night" atau "dark" di spec berarti gelap, "light" berarti terang.
async function theme(shot) {
  if (!shot.theme) return false;
  const want = shot.theme === "light" ? "light" : "dark";
  const have = await evaluate(`localStorage.getItem("act-theme") === "light" ? "light" : "dark"`);
  if (have === want) return false;
  await evaluate(`localStorage.setItem("act-theme", "${want}")`);
  return true;
}
async function capture(shot) {
  let clip;
  if (shot.fullPage) {
    const metrics = await send("Page.getLayoutMetrics");
    const height = Math.ceil(metrics.cssContentSize.height);
    await viewport(shot.width, height, shot.width < 768);
    await sleep(500);
    clip = { x: 0, y: 0, width: shot.width, height, scale: 1 };
  }
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: Boolean(shot.fullPage), ...(clip ? { clip } : {}) });
  writeFileSync(join(outDir, shot.file), Buffer.from(data, "base64"));
  console.log("saved", shot.file, shot.path);
  await viewport(shot.width, shot.height, shot.width < 768);
}
async function shoot(shot) {
  await viewport(shot.width, shot.height, shot.width < 768);
  await go(shot.path);
  if (await theme(shot)) await go(shot.path);
  await capture(shot);
}

await send("Page.enable");
await send("Runtime.enable");
// Animasi masuk dimatikan agar screenshot tidak menangkap elemen setengah tampil.
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });

for (const shot of spec.public ?? []) await shoot(shot);

// Masuk dengan akun lokal (login lokal tidak memeriksa password; isi tetap wajib lolos validasi form).
await viewport(1440, 900, false);
await go("/login");
await evaluate(`(() => {
  const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value"); d.set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
  set(document.querySelector('input[name="username"]'), ${JSON.stringify(username)});
  set(document.querySelector('input[name="password"]'), ${JSON.stringify(password)});
  document.querySelector('form').requestSubmit();
  return true;
})()`);
for (let i = 0; i < 50; i++) {
  await sleep(300);
  const path = await evaluate("location.pathname");
  if (path && path !== "/login") break;
}
await settle();

for (const shot of spec.private ?? []) await shoot(shot);

ws.close();
chrome.kill();
await sleep(300);
try {
  rmSync(profileDir, { recursive: true, force: true });
} catch {
  // Profil sementara Chrome boleh tertinggal.
}
process.exit(0);
