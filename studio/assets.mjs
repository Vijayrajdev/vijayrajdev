// Generates every static SVG in assets/Design from profile.config.mjs:
// section headers, the platform diagram, skill rows,
// social and call-to-action buttons, and the divider.
//   node studio/assets.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import profile from "../profile.config.mjs";
import { tile } from "./lib/logos.mjs";

const OUT = resolve(import.meta.dirname, "..", "assets/Design");
mkdirSync(OUT, { recursive: true });

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace";
const BORDER = "#24304a";
const CYAN = "#22d3ee", VIOLET = "#a78bfa", PINK = "#f472b6";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const write = (name, svg) => writeFileSync(resolve(OUT, name), svg);

// Greedy word wrap by character count (SVG text has no wrapping of its own).
function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if ((line + " " + word).trim().length > max && line) { lines.push(line); line = word; } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

const GRADIENT = `<linearGradient id="h" x1="0" x2="1"><stop offset="0" stop-color="${CYAN}"/><stop offset=".5" stop-color="${VIOLET}"/><stop offset="1" stop-color="${PINK}"/></linearGradient>`;
const CARD = `<linearGradient id="card" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121a31"/><stop offset="1" stop-color="#0b1122"/></linearGradient>`;

// ── section headers ─────────────────────────────────────────────────────────
function header(slug, n, title, sub) {
  const W = 1600, H = 150;
  write(`h-${slug}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}: ${esc(sub)}">
  <title>${esc(title)}</title>
  <defs>
    ${GRADIENT}
    <linearGradient id="line" x1="0" x2="1"><stop offset="0" stop-color="${VIOLET}" stop-opacity=".7"/><stop offset="1" stop-color="${VIOLET}" stop-opacity="0"/></linearGradient>
    <filter id="glow" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <style>
    .n { font: 800 104px ${SANS}; letter-spacing: -4px; }
    .t { font: 800 46px ${SANS}; fill: #eef2ff; letter-spacing: -1.2px; }
    .s { font: 400 20px ${SANS}; fill: #8b98b5; }
    .spark { animation: run 5s cubic-bezier(.6,0,.4,1) infinite; }
    @keyframes run { from { transform: translateX(0); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } to { transform: translateX(${W - 640}px); opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .spark { animation: none; opacity: 0; } }
  </style>
  <text x="4" y="112" class="n" fill="none" stroke="url(#h)" stroke-width="2">${String(n).padStart(2, "0")}</text>
  <text x="168" y="74" class="t">${esc(title)}</text>
  <text x="170" y="112" class="s">${esc(sub)}</text>
  <rect x="170" y="134" width="${W - 170}" height="1.5" fill="url(#line)"/>
  <g class="spark"><circle cx="190" cy="134.75" r="6" fill="${CYAN}" filter="url(#glow)"/><circle cx="190" cy="134.75" r="2.5" fill="#fff"/></g>
</svg>
`);
}

// ── platform diagram ────────────────────────────────────────────────────────
async function platform() {
  const { stages, foundation } = profile.platform;
  const W = 1600, top = 20, gapX = 34, colW = (W - 2 - (stages.length - 1) * gapX) / stages.length, x0 = 1;
  const cardH = 236, cy = top + 70, H = top + cardH + 44 + 70 + 2;
  const parts = [], flows = [];
  for (const [i, s] of stages.entries()) {
    const x = x0 + i * (colW + gapX);
    parts.push(`<rect x="${x}" y="${top}" width="${colW}" height="${cardH}" rx="20" fill="url(#card)" stroke="${BORDER}"/>
    <rect x="${x + 20}" y="${top}" width="${colW - 40}" height="2" fill="${s.color}" opacity=".9"/>
    <text x="${x + 22}" y="${top + 34}" class="k" fill="${s.color}">${String(i + 1).padStart(2, "0")} · ${esc(s.title.toUpperCase())}</text>`);
    if (s.logos.length) {
      for (const [j, l] of s.logos.entries()) parts.push(await tile(l, x + 22 + j * 58, top + 50, 48));
    } else {
      for (let j = 0; j < 3; j++) parts.push(`<rect x="${x + 22 + j * 8}" y="${top + 52 + j * 8}" width="36" height="28" rx="7" fill="#1b2540" stroke="#3a4a6e"/>`);
    }
    parts.push(`<text x="${x + 22}" y="${top + 136}" class="t">${esc(s.title)}</text>`);
    s.lines.forEach((line, j) => parts.push(`<text x="${x + 22}" y="${top + 168 + j * 22}" class="s">${esc(line)}</text>`));
    if (i < stages.length - 1) {
      const d = `M${x + colW} ${cy} L${x + colW + gapX} ${cy}`;
      flows.push(`<path d="${d}" class="flow" stroke="${s.color}"/>`);
      for (let k = 0; k < 2; k++) flows.push(`<circle r="3.5" fill="${stages[i + 1].color}" filter="url(#glow)"><animateMotion dur="1.6s" begin="-${(i * 0.27 + k * 0.8).toFixed(2)}s" repeatCount="indefinite" path="${d}"/></circle>`);
    }
  }
  const fy = top + cardH + 44;
  const found = [];
  let fx = x0 + 280;
  for (const [label, src] of foundation) {
    found.push(await tile(src, fx, fy + 18, 34));
    found.push(`<text x="${fx + 44}" y="${fy + 41}" class="f">${esc(label)}</text>`);
    fx += 96 + label.length * 9.2;
  }
  write("platform.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(stages.map((s) => s.title).join(" → "))}, built on ${esc(foundation.map((f) => f[0]).join(", "))}">
  <title>${esc(profile.platform.heading)}</title>
  <defs>${CARD}
    <filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <style>
    .k { font: 700 12px ${SANS}; letter-spacing: .16em; }
    .t { font: 700 24px ${SANS}; fill: #eef2ff; letter-spacing: -.3px; }
    .s { font: 400 15px ${SANS}; fill: #8b98b5; }
    .f { font: 500 15px ${SANS}; fill: #c9d3ee; }
    .flow { fill: none; stroke-width: 2; stroke-dasharray: 4 6; stroke-opacity: .7; animation: flow 1s linear infinite; }
    @keyframes flow { to { stroke-dashoffset: -20; } }
    @media (prefers-reduced-motion: reduce) { .flow { animation: none; } }
  </style>
  ${flows.join("\n  ")}
  ${parts.join("\n  ")}
  <rect x="${x0}" y="${fy}" width="${W - 2}" height="70" rx="18" fill="#0b1122" stroke="${BORDER}" stroke-dasharray="5 5"/>
  <text x="${x0 + 24}" y="${fy + 41}" class="k" fill="#94a3c4">FOUNDATION · AS CODE</text>
  ${found.join("\n  ")}
</svg>
`);
}

// ── skill rows ──────────────────────────────────────────────────────────────
async function stackRow({ title, slug, items }) {
  const size = 64, gap = 14, labelH = 26, top = 34;
  const w = Math.max(items.length * size + (items.length - 1) * gap, 600);
  const h = top + size + labelH;
  const parts = [`<text x="0" y="16" class="k">${esc(title.toUpperCase())}</text>`];
  for (const [i, [label, spec]] of items.entries()) {
    const x = i * (size + gap);
    parts.push(await tile(spec, x, top, size));
    parts.push(`<text x="${x + size / 2}" y="${top + size + 19}" class="l">${esc(label)}</text>`);
  }
  write(`stack-${slug}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}: ${esc(items.map((i) => i[0]).join(", "))}">
  <title>${esc(title)}</title>
  <defs>${GRADIENT}</defs>
  <style>.l { font: 500 12px ${SANS}; fill: #8b98b5; text-anchor: middle; } .k { font: 700 13px ${SANS}; letter-spacing: .18em; fill: url(#h); }</style>
  ${parts.join("\n  ")}
</svg>
`);
}

// ── buttons ─────────────────────────────────────────────────────────────────
export const slugOf = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function social({ label, icon }) {
  const h = 48, size = 28, padL = 12, gap = 10;
  const w = Math.round(padL + size + gap + label.length * 8.1 + 16);
  write(`social-${slugOf(label)}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
  <title>${esc(label)}</title>
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151e33"/><stop offset="1" stop-color="#121a2e"/></linearGradient></defs>
  <rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${(h - 1) / 2}" fill="url(#bg)" stroke="${BORDER}"/>
  ${await tile(icon, padL, (h - size) / 2, size)}
  <text x="${padL + size + gap}" y="${h / 2 + 5}" style="font: 600 14.5px ${SANS}; fill: #e6edf3">${esc(label)}</text>
</svg>
`);
}

function cta(slug, label, glyph) {
  const h = 52, w = Math.round(64 + label.length * 9.1 + 26);
  write(`cta-${slug}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
  <title>${esc(label)}</title>
  <defs>
    ${GRADIENT}
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18213b"/><stop offset="1" stop-color="#0d1426"/></linearGradient>
  </defs>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${(h - 2) / 2}" fill="url(#bg)" stroke="url(#h)" stroke-width="1.5"/>
  <circle cx="30" cy="${h / 2}" r="15" fill="#ffffff" fill-opacity=".06"/>
  <g transform="translate(31 ${h / 2})">${glyph}</g>
  <text x="56" y="${h / 2 + 5.5}" style="font: 600 15.5px ${SANS}; fill: #eef2ff">${esc(label)}</text>
</svg>
`);
}

function divider() {
  write("divider.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="6" viewBox="0 0 1200 6" aria-hidden="true">
  <defs><linearGradient id="g" x1="0" x2="1">
    <stop offset="0" stop-color="${CYAN}" stop-opacity="0"/><stop offset=".2" stop-color="${CYAN}"/><stop offset=".5" stop-color="${VIOLET}"/>
    <stop offset=".8" stop-color="${PINK}"/><stop offset="1" stop-color="${PINK}" stop-opacity="0"/>
  </linearGradient></defs>
  <rect y="2" width="1200" height="2" rx="1" fill="url(#g)"/>
</svg>
`);
}

// ── run ─────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const order = ["about", "platform", "projects", "stack", "galaxy", "stats"].filter((k) => profile.sections[k] ?? true);
  order.forEach((k, i) => header(k, i + 1, ...profile.headers[k]));
  if (profile.sections.platform) await platform();
  for (const s of profile.stacks) await stackRow(s);
  for (const s of profile.socials) await social(s);
  cta("play", "Play with the 3D core", `<path d="M-6 -8 L9 0 L-6 8 Z" fill="${CYAN}"/>`);
  cta("star", "Leave your star in the galaxy", `<path d="M0 -10 Q0 0 10 0 Q0 0 0 10 Q0 0 -10 0 Q0 0 0 -10 Z" fill="#c4b5fd"/>`);
  divider();
  console.log(`assets: ${order.length} headers, ${profile.stacks.length} skill rows, ${profile.socials.length} socials -> assets/Design`);
}
