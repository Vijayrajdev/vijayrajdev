// Records a seamless loop of a live/ scene into an animated WebP.
//   node record.mjs --page live/index.html --out assets/Design/hero.webp --w 1600 --h 640 --fps 24
//   add --still 1.5 to write a single PNG at t=1.5s instead (handy for previews)
// Frames are captured by several browser pages at once and each frame is encoded on its own core,
// then muxed into one animated WebP, so a long loop no longer waits on a single-threaded encoder.
import { cpus } from "node:os";
process.env.UV_THREADPOOL_SIZE ||= String(cpus().length); // sharp encodes on libuv's pool
import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";
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
const QUALITY = +(args.q ?? 92);
const DPR = +(args.dpr ?? 2); // supersampling factor: render at DPR x, then downsample to --outw
const query = args.query ?? "capture";
const PAGES = +(args.pages ?? 3); // browser pages capturing in parallel

// ---- animated WebP muxer: wraps independently encoded still frames as ANMF chunks ----
function riffChunk(id, data) {
  const b = Buffer.alloc(8 + data.length + (data.length & 1));
  b.write(id, 0, "ascii");
  b.writeUInt32LE(data.length, 4);
  data.copy(b, 8);
  return b;
}
function frameChunks(webp) {
  const out = [];
  for (let o = 12; o + 8 <= webp.length;) {
    const id = webp.toString("ascii", o, o + 4), size = webp.readUInt32LE(o + 4);
    if (id === "ALPH" || id === "VP8 " || id === "VP8L") out.push(riffChunk(id, webp.subarray(o + 8, o + 8 + size)));
    o += 8 + size + (size & 1);
  }
  return Buffer.concat(out);
}
function muxAnimated(frames, w, h, delayMs) {
  const vp8x = Buffer.alloc(10);
  vp8x[0] = 0x10 | 0x02; // alpha + animation
  vp8x.writeUIntLE(w - 1, 4, 3);
  vp8x.writeUIntLE(h - 1, 7, 3);
  const anim = Buffer.alloc(6); // transparent background, loop forever
  const anmf = frames.map((f) => {
    const head = Buffer.alloc(16);
    head.writeUIntLE(w - 1, 6, 3);
    head.writeUIntLE(h - 1, 9, 3);
    head.writeUIntLE(delayMs, 12, 3);
    head[15] = 0x02; // replace, don't blend
    return riffChunk("ANMF", Buffer.concat([head, frameChunks(f)]));
  });
  const body = Buffer.concat([Buffer.from("WEBP"), riffChunk("VP8X", vp8x), riffChunk("ANIM", anim), ...anmf]);
  const riff = Buffer.alloc(8);
  riff.write("RIFF", 0, "ascii");
  riff.writeUInt32LE(body.length, 4);
  return Buffer.concat([riff, body]);
}

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
  const openPage = async () => {
    const page = await browser.newPage();
    page.on("console", (m) => m.type() === "error" && console.error("[page]", m.text()));
    page.on("pageerror", (e) => console.error("[page]", e.message));
    await page.setViewport({ width: W, height: H, deviceScaleFactor: DPR });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 120_000 });
    await page.waitForFunction("window.__ready && window.__renderAt", { timeout: 60_000 });
    return page;
  };
  const shot = async (page, t) => {
    await page.evaluate((t) => window.__renderAt(t), t);
    // two renders: the first warms transmission/bloom targets for this frame
    await page.evaluate((t) => window.__renderAt(t), t);
    // optimizeForSpeed: Chrome PNG-encodes screenshots on one thread, which dominates at high DPR
    return page.screenshot({ type: "png", omitBackground: true, optimizeForSpeed: true });
  };

  if (args.still !== undefined) {
    const png = await shot(await openPage(), +args.still);
    await sharp(png).toFile(out);
    console.log(`still -> ${out}`);
  } else {
    const pages = await Promise.all(Array.from({ length: PAGES }, openPage));
    const loop = await pages[0].evaluate(() => window.__LOOP);
    const n = Math.round(loop * FPS);
    const outW = +(args.outw ?? W);
    const encoded = new Array(n);
    const t0 = Date.now();
    let done = 0;
    // each page takes every PAGES-th frame; each frame is downscaled and encoded as soon as it is captured
    await Promise.all(pages.map(async (page, k) => {
      const jobs = [];
      for (let i = k; i < n; i += PAGES) {
        const png = await shot(page, (i / n) * loop);
        jobs.push(sharp(png).resize(outW, null, { kernel: "lanczos3" })
          .webp({ quality: QUALITY, alphaQuality: 100, effort: 6, smartSubsample: true, preset: "picture" })
          .toBuffer()
          .then((b) => { encoded[i] = b; if (++done % Math.ceil(n / 10) === 0 || done === n) console.log(`progress ${done}/${n} ${Math.round((Date.now() - t0) / 1000)}s`); }));
      }
      await Promise.all(jobs);
    }));
    const { width, height } = await sharp(encoded[0]).metadata();
    const webp = muxAnimated(encoded, width, height, Math.round(1000 / FPS));
    await writeFile(out, webp);
    await sharp(out, { pages: -1 }).metadata(); // sanity check: throws if the mux is malformed
    console.log(`${n} frames -> ${out} (${(webp.length / 1024 / 1024).toFixed(2)} MB)`);
  }
} finally {
  await browser.close();
  server.close();
}
