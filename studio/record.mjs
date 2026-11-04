// Records a seamless loop of a live/ scene into an animated WebP.
//   node record.mjs --page live/index.html --out assets/Design/hero.webp --w 1600 --h 640 --fps 24
//   add --still 1.5 to write a single PNG at t=1.5s instead (handy for previews)
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import puppeteer from "puppeteer";
import sharp from "sharp";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), [])
);
const ROOT = resolve(import.meta.dirname, "..");
const page_ = args.page ?? "live/index.html";
const out = resolve(ROOT, args.out ?? "assets/Design/hero.webp");
const W = +(args.w ?? 1600), H = +(args.h ?? 640), FPS = +(args.fps ?? 24);
const QUALITY = +(args.q ?? 82);
const query = args.query ?? "capture";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const server = http.createServer(async (req, res) => {
  try {
    const file = join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!file.startsWith(ROOT)) throw new Error("outside root");
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/${page_}?${query}`;

const browser = await puppeteer.launch({
  headless: true,
  args: ["--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--hide-scrollbars"],
});
try {
  const page = await browser.newPage();
  page.on("console", (m) => m.type() === "error" && console.error("[page]", m.text()));
  page.on("pageerror", (e) => console.error("[page]", e.message));
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 120_000 });
  await page.waitForFunction("window.__ready && window.__renderAt", { timeout: 60_000 });

  const shot = async (t) => {
    await page.evaluate((t) => window.__renderAt(t), t);
    // two renders: the first warms transmission/bloom targets for this frame
    await page.evaluate((t) => window.__renderAt(t), t);
    return page.screenshot({ type: "png", omitBackground: true });
  };

  if (args.still !== undefined) {
    const png = await shot(+args.still);
    await sharp(png).toFile(out);
    console.log(`still -> ${out}`);
  } else {
    const loop = await page.evaluate(() => window.__LOOP);
    const n = Math.round(loop * FPS);
    const frames = [];
    for (let i = 0; i < n; i++) {
      frames.push(await shot((i / n) * loop));
      process.stdout.write(`\rframe ${i + 1}/${n}`);
    }
    process.stdout.write("\n");
    const outW = +(args.outw ?? W);
    const scaled = await Promise.all(frames.map((f) => sharp(f).resize(outW).png().toBuffer()));
    const info = await sharp(scaled, { join: { animated: true } })
      .webp({ quality: QUALITY, alphaQuality: 90, effort: 6, smartSubsample: true, loop: 0, delay: Array(n).fill(Math.round(1000 / FPS)) })
      .toFile(out);
    console.log(`${n} frames -> ${out} (${(info.size / 1024 / 1024).toFixed(2)} MB)`);
  }
} finally {
  await browser.close();
  server.close();
}
