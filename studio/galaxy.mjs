// Galaxy guestbook: every visitor who opens a "galaxy:" issue becomes a named star.
//   node studio/galaxy.mjs add <github-login>   adds a star (idempotent) and redraws
//   node studio/galaxy.mjs                      just redraws
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DATA = resolve(ROOT, "assets/Design/galaxy.json");
const OUT = resolve(ROOT, "assets/Design/galaxy.svg");

const W = 1600, H = 720, CX = 800, CY = 400, TILT = 0.42;
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace";

const stars = existsSync(DATA) ? JSON.parse(readFileSync(DATA, "utf8")) : [];

const [cmd, login] = process.argv.slice(2);
if (cmd === "add") {
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(login ?? "")) {
    console.error(`invalid login: ${login}`);
    process.exit(1);
  }
  if (stars.some((s) => s.login.toLowerCase() === login.toLowerCase())) {
    console.log(`already-starred`);
  } else {
    stars.push({ login, at: new Date().toISOString().slice(0, 10) });
    writeFileSync(DATA, JSON.stringify(stars, null, 2) + "\n");
    console.log(`added`);
  }
}

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
function hash(str) {
  let h = 2166136261;
  for (const c of str.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
const gauss = (r) => (r() + r() + r() - 1.5) / 1.5;

// point on a two-armed logarithmic spiral, galaxy-local (untilted) coords
function spiral(arm, t, spread, r) {
  const theta = t * 3.4 * Math.PI + arm * Math.PI;
  const rad = 40 + 560 * Math.pow(t, 0.9);
  const x = Math.cos(theta) * rad + gauss(r) * spread * (0.4 + t);
  const y = Math.sin(theta) * rad + gauss(r) * spread * (0.4 + t);
  return [x, y];
}
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const hex = (c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
const CYAN = [34, 211, 238], VIOLET = [167, 139, 250], PINK = [244, 114, 182], WHITE = [238, 242, 255];
function tone(t) {
  return t < 0.25 ? mix(WHITE, CYAN, t / 0.25) : t < 0.6 ? mix(CYAN, VIOLET, (t - 0.25) / 0.35) : mix(VIOLET, PINK, (t - 0.6) / 0.4);
}

// ---- dust (rotates) ----
const r = rng(42);
const dust = [];
for (let i = 0; i < 3200; i++) {
  const t = Math.pow(r(), 0.8), arm = i % 2;
  const [x, y] = spiral(arm, t, 34, r);
  const size = (0.6 + r() * 1.6) * (1.25 - t * 0.5);
  const op = (0.35 + r() * 0.65).toFixed(2);
  dust.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(2)}" fill="${hex(tone(t))}" opacity="${op}"/>`);
}
for (let i = 0; i < 260; i++) {
  const a = r() * Math.PI * 2, d = Math.abs(gauss(r)) * 120;
  dust.push(`<circle cx="${(Math.cos(a) * d).toFixed(1)}" cy="${(Math.sin(a) * d).toFixed(1)}" r="${(0.6 + r()).toFixed(2)}" fill="#fff6e8" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`);
}

// soft glowing arm ribbons under the dust
const arms = [0, 1].map((arm) => {
  const pts = [];
  for (let t = 0.04; t <= 1; t += 0.01) pts.push(spiral(arm, t, 0, () => 0.5).map((v) => v.toFixed(1)).join(","));
  return `<polyline points="${pts.join(" ")}" fill="none" stroke="${arm ? "#f472b6" : "#22d3ee"}" stroke-opacity=".22" stroke-width="70" stroke-linecap="round" filter="url(#arm)"/>
        <polyline points="${pts.join(" ")}" fill="none" stroke="#a78bfa" stroke-opacity=".28" stroke-width="22" stroke-linecap="round" filter="url(#arm)"/>`;
}).join("\n        ");

// ---- background stars ----
const bg = [];
for (let i = 0; i < 160; i++) {
  bg.push(`<circle class="tw" cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(0.4 + r() * 1).toFixed(2)}" style="animation-delay:-${(r() * 5).toFixed(2)}s"/>`);
}

// ---- visitor stars (fixed, labelled) ----
const placed = [];
const visitors = stars.map((s, i) => {
  const h = hash(s.login), vr = rng(h);
  let x, y, tries = 0;
  do {
    const t = 0.22 + vr() * 0.72;
    const [gx, gy] = spiral(h & 1, t, 30, vr);
    x = CX + gx; y = CY + gy * TILT;
    tries++;
  } while (tries < 30 && placed.some(([px, py]) => Math.abs(px - x) < 120 && Math.abs(py - y) < 26));
  placed.push([x, y]);
  const newest = i === stars.length - 1;
  const c = hex(tone(Math.min(1, Math.hypot(x - CX, (y - CY) / TILT) / 600)));
  const sparkle = (k) => `M0 ${-k}Q0 0 ${k} 0Q0 0 0 ${k}Q0 0 ${-k} 0Q0 0 0 ${-k}Z`;
  const k = newest ? 13 : 9;
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
      ${newest ? `<circle class="ping" r="10" fill="none" stroke="${c}" stroke-width="1.5"/>` : ""}
      <circle r="${k * 1.6}" fill="url(#halo)" opacity=".9"/>
      <path class="spark" style="animation-delay:-${(i * 0.73) % 4}s" d="${sparkle(k)}" fill="#fff" filter="url(#bloom)"/>
      <circle r="2.2" fill="${c}"/>
      <text class="lbl${newest ? " new" : ""}" x="${k + 7}" y="4">@${esc(s.login)}</text>
    </g>`;
});

const count = stars.length;
const newest = stars.at(-1);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="A galaxy of ${count} visitor stars">
  <title>Galaxy guestbook: ${count} stars</title>
  <defs>
    <radialGradient id="sky" cx=".5" cy=".55" r=".75">
      <stop offset="0" stop-color="#0d1030"/><stop offset=".55" stop-color="#070a1a"/><stop offset="1" stop-color="#03050c"/>
    </radialGradient>
    <radialGradient id="core" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".14" stop-color="#fde9ff" stop-opacity=".85"/><stop offset=".3" stop-color="#c4b5fd" stop-opacity=".45"/>
      <stop offset=".5" stop-color="#7c3aed" stop-opacity=".16"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="halo" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#a78bfa" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="title" x1="0" x2="1">
      <stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#f472b6"/>
    </linearGradient>
    <filter id="bloom" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="arm" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="28"/></clipPath>
  </defs>
  <style>
    .tw { fill: #dbe4ff; animation: tw 5s ease-in-out infinite; }
    @keyframes tw { 50% { opacity: .15; } }
    .spin { animation: spin 240s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spark { animation: spark 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
    @keyframes spark { 0%, 100% { transform: scale(.75) rotate(0deg); opacity: .8; } 50% { transform: scale(1.1) rotate(45deg); opacity: 1; } }
    .ping { animation: ping 2.4s ease-out infinite; transform-box: fill-box; transform-origin: center; }
    @keyframes ping { from { transform: scale(.6); opacity: .9; } to { transform: scale(3.2); opacity: 0; } }
    .lbl { font: 500 14px ${MONO}; fill: #c9d3ee; paint-order: stroke; stroke: #05070f; stroke-width: 4px; stroke-linejoin: round; }
    .lbl.new { fill: #fff; font-weight: 700; }
    .k { font: 600 14px ${MONO}; letter-spacing: .3em; fill: #22d3ee; }
    .h { font: 800 44px ${SANS}; letter-spacing: -1px; }
    .s { font: 400 18px ${SANS}; fill: #94a3c4; }
    .s b { fill: #eef2ff; font-weight: 600; }
    @media (prefers-reduced-motion: reduce) { .tw, .spin, .spark, .ping { animation: none; } }
  </style>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    ${bg.join("\n    ")}
    <ellipse cx="${CX}" cy="${CY}" rx="560" ry="${560 * TILT}" fill="#5b21b6" opacity=".16" filter="url(#soft)"/>
    <g transform="translate(${CX} ${CY}) scale(1 ${TILT})">
      <g class="spin">
        ${arms}
        ${dust.join("\n        ")}
      </g>
    </g>
    <ellipse cx="${CX}" cy="${CY}" rx="190" ry="${190 * TILT * 1.25}" fill="url(#core)"/>
    ${visitors.join("\n    ")}
  </g>
  <rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="28" fill="none" stroke="#ffffff" stroke-opacity=".09" stroke-width="1.5"/>

  <text class="k" x="56" y="74">GALAXY · GUESTBOOK</text>
  <text class="h" x="54" y="126" fill="url(#title)">${count} ${count === 1 ? "star" : "stars"} and counting</text>
  <text class="s" x="56" y="160">Every visitor who says hi becomes a star. ${newest ? `Newest: <tspan font-weight="600" fill="#eef2ff">@${esc(newest.login)}</tspan>` : ""}</text>
</svg>
`;
writeFileSync(OUT, svg);
console.log(`galaxy: ${count} stars -> ${OUT}`);
