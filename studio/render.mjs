// Records the 3D hero and project cards to animated WebP, several at once
// (WebP encoding is single-threaded, so parallel runs use the spare cores).
//   node render.mjs                 hero + every card in profile.config.mjs
//   node render.mjs hero            just the hero
//   node render.mjs pipewright      just one card (any project id)
import { spawn } from "node:child_process";
import { cpus } from "node:os";
import profile from "../profile.config.mjs";

// Output sizes match how GitHub displays them on a Retina screen. --dpr renders larger and downsamples
// (hero 3x for maximum sharpness, cards 2.56x), which anti-aliases every edge.
const JOBS = {
  hero: ["--page", "live/index.html", "--out", "assets/Design/hero.webp", "--w", "1600", "--h", "640", "--outw", "2048", "--fps", "24", "--q", "100", "--dpr", "3"],
  ...Object.fromEntries(profile.projects.map((p) => [p.id, [
    "--page", "live/card.html", "--query", `capture&id=${p.id}`, "--out", `assets/Design/card-${p.id}.webp`,
    "--w", "800", "--h", "880", "--dpr", "2.56", "--outw", "1024", "--fps", "20", "--q", "90",
  ]])),
};

const wanted = process.argv.slice(2);
const unknown = wanted.filter((w) => !JOBS[w]);
if (unknown.length) {
  console.error(`unknown: ${unknown.join(", ")}. Choose from: ${Object.keys(JOBS).join(", ")}`);
  process.exit(1);
}
const queue = (wanted.length ? wanted : Object.keys(JOBS)).map((name) => [name, JOBS[name]]);
const limit = Math.max(1, Math.min(queue.length, cpus().length - 2));
const started = Date.now();
let failed = 0;

async function worker() {
  while (queue.length) {
    const [name, args] = queue.shift();
    console.log(`▶ ${name}`);
    const code = await new Promise((done) => {
      const child = spawn(process.execPath, ["record.mjs", ...args], { cwd: import.meta.dirname, stdio: ["ignore", "pipe", "pipe"] });
      child.stdout.on("data", (d) => {
        for (const line of String(d).split("\n")) {
          if (/^progress /.test(line)) console.log(`  ${name}: ${line.slice(9)}`);
          const m = line.match(/\d+ frames -> .*/);
          if (m) console.log(`✔ ${name}: ${m[0].replace(/^.*\/assets/, "assets")}`);
        }
      });
      child.stderr.on("data", (d) => { if (!/404/.test(d)) process.stderr.write(`[${name}] ${d}`); });
      child.on("close", done);
    });
    if (code) { failed++; console.error(`✖ ${name} exited with ${code}`); }
  }
}

console.log(`rendering ${queue.length} asset(s), ${limit} at a time`);
await Promise.all(Array.from({ length: limit }, worker));
console.log(`done in ${Math.round((Date.now() - started) / 60000)} min${failed ? `, ${failed} failed` : ""}`);
process.exit(failed ? 1 : 0);
