// Records the 3D hero and project cards to animated WebP, several at once
// (WebP encoding is single-threaded, so parallel runs use the spare cores).
//   node render.mjs                 hero + every card in profile.config.mjs
//   node render.mjs hero            just the hero (also: about)
//   node render.mjs pipewright      just one card (any project id)
import { spawn } from "node:child_process";
import { cpus, setPriority } from "node:os";
import profile from "../profile.config.mjs";

// Output sizes match how GitHub displays them on a Retina screen. --dpr renders larger and downsamples
// (hero 3x for maximum sharpness, cards 2.56x), which anti-aliases every edge.
const JOBS = {
  about: ["--page", "live/about.html", "--out", "assets/Design/about.webp", "--w", "1600", "--h", "560", "--outw", "2048", "--dpr", "2.56", "--fps", "20", "--q", "90"],
  hero: ["--page", "live/index.html", "--out", "assets/Design/hero.webp", "--w", "1600", "--h", "640", "--outw", "2048", "--fps", "24", "--q", "100", "--dpr", "3"],
  ...Object.fromEntries(profile.projects.map((p) => [p.id, [
    "--page", "live/card.html", "--query", `capture&id=${p.id}`, "--out", `assets/Design/card-${p.id}.webp`,
    // a spotlight card spans the README width, so it's recorded wide and at hero resolution
    ...(p.spotlight ? ["--w", "1600", "--h", "700", "--outw", "2048"] : ["--w", "800", "--h", "880", "--outw", "1024"]),
    "--dpr", "2.56", "--fps", "20", "--q", "90",
  ]])),
};

// --cpu <fraction> caps how much of the machine rendering may use (default 0.5: half the cores).
// Jobs run at low priority either way, so the rest of the system stays responsive.
const argv = process.argv.slice(2);
const cpuIdx = argv.indexOf("--cpu");
const CPU_SHARE = cpuIdx >= 0 ? Math.min(1, Math.max(0.1, +argv.splice(cpuIdx, 2)[1])) : 0.5;
const wanted = argv;
const unknown = wanted.filter((w) => !JOBS[w]);
if (unknown.length) {
  console.error(`unknown: ${unknown.join(", ")}. Choose from: ${Object.keys(JOBS).join(", ")}`);
  process.exit(1);
}
const queue = (wanted.length ? wanted : Object.keys(JOBS)).map((name) => [name, JOBS[name]]);
const budget = Math.max(1, Math.floor(cpus().length * CPU_SHARE)); // threads we may keep busy
const limit = Math.max(1, Math.min(queue.length, Math.floor(budget / 2))); // each job is roughly Chrome + an encoder
const threadsPerJob = String(Math.max(1, Math.floor(budget / limit)));
const started = Date.now();
let failed = 0;

async function worker() {
  while (queue.length) {
    const [name, args] = queue.shift();
    console.log(`▶ ${name}`);
    const code = await new Promise((done) => {
      const child = spawn(process.execPath, ["record.mjs", ...args], {
        cwd: import.meta.dirname, stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, UV_THREADPOOL_SIZE: threadsPerJob }, // encoder threads for this job
      });
      try { setPriority(child.pid, 15); } catch {} // background priority
      child.stdout.on("data", (d) => {
        for (const line of String(d).split("\n")) {
          if (/^progress encoded /.test(line)) console.log(`  ${name}: ${line.slice(17)}`);
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

console.log(`rendering ${queue.length} asset(s), ${limit} at a time, ${threadsPerJob} encoder threads each, low priority (--cpu ${CPU_SHARE})`);
await Promise.all(Array.from({ length: limit }, worker));
console.log(`done in ${Math.round((Date.now() - started) / 60000)} min${failed ? `, ${failed} failed` : ""}`);
process.exit(failed ? 1 : 0);
