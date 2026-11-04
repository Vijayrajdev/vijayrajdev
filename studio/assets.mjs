// Generates every static SVG in assets/Design from profile.config.mjs:
// section headers, the About bento grid, the platform diagram, skill rows,
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

// ── About: bento grid ───────────────────────────────────────────────────────
async function about() {
  const a = profile.about;
  const W = 1600, H = 560, g = 20, col1 = 540;
  const right = W - col1 - g, half = (right - g) / 2, rowH = (H - g) / 2;

  let avatar = "";
  try {
    const res = await fetch(`https://github.com/${profile.github}.png?size=256`);
    if (res.ok) avatar = `data:${res.headers.get("content-type") ?? "image/png"};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {}

  const tileRect = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="url(#card)" stroke="${BORDER}"/>
  <rect x="${x + 26}" y="${y}" width="${w - 52}" height="1.5" fill="#fff" opacity=".10"/>`;
  const kicker = (x, y, text, color = CYAN) => `<text x="${x}" y="${y}" class="k" fill="${color}">${esc(text.toUpperCase())}</text>`;

  // tile A: identity
  const intro = wrap(a.intro, 44).map((l, i) => `<text x="44" y="${366 + i * 30}" class="b">${esc(l)}</text>`).join("");
  const A = `${tileRect(0, 0, col1, H)}
  <circle cx="108" cy="112" r="66" fill="none" stroke="url(#h)" stroke-width="3"/>
  ${avatar ? `<image href="${avatar}" x="48" y="52" width="120" height="120" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice"/>` : `<circle cx="108" cy="112" r="60" fill="#1b2540"/>`}
  <circle cx="160" cy="160" r="11" fill="#0b1122"/><circle cx="160" cy="160" r="7" fill="#4ade80"><animate attributeName="opacity" values="1;.35;1" dur="2.4s" repeatCount="indefinite"/></circle>
  <text x="44" y="240" class="name">${esc(profile.name)}</text>
  <text x="44" y="282" class="role" fill="url(#h)">${esc(a.role)}</text>
  <text x="44" y="310" class="s">at ${esc(a.company)}</text>
  ${intro}
  <g transform="translate(44 ${H - 58})">
    <path d="M8 0C3.6 0 0 3.5 0 7.9 0 13.8 8 22 8 22s8-8.2 8-14.1C16 3.5 12.4 0 8 0Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="${CYAN}"/>
    <text x="28" y="16" class="s" style="fill:#c9d3ee">${esc(a.location)}</text>
  </g>`;

  // tile B: focus
  const bx = col1 + g;
  const focus = a.focus.map((f, i) => `<g transform="translate(${bx + 40} ${84 + i * 50})">
      <rect width="34" height="34" rx="10" fill="#ffffff" fill-opacity=".05" stroke="${BORDER}"/>
      <text x="17" y="23" class="num" fill="url(#h)">${i + 1}</text>
      <text x="52" y="24" class="f">${esc(f)}</text>
    </g>`).join("");
  const B = `${tileRect(bx, 0, right, rowH)}
  ${kicker(bx + 40, 52, "Focus")}
  ${focus}`;

  // tile C: currently building
  const cy0 = rowH + g;
  const C = `${tileRect(bx, cy0, half, rowH)}
  <circle cx="${bx + 46}" cy="${cy0 + 47}" r="5" fill="${PINK}"><animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite"/></circle>
  ${kicker(bx + 60, cy0 + 52, "Currently building", PINK)}
  <text x="${bx + 40}" y="${cy0 + 112}" class="big" fill="url(#h)">${esc(a.building.name)}</text>
  ${wrap(a.building.text, 40).map((l, i) => `<text x="${bx + 40}" y="${cy0 + 152 + i * 28}" class="b">${esc(l)}</text>`).join("")}`;

  // tile D: ask me about + also
  const dx = bx + half + g;
  let cx = dx + 40, cyy = cy0 + 82;
  const chips = a.askMeAbout.map((t) => {
    const w = t.length * 9.4 + 32;
    if (cx + w > dx + half - 30) { cx = dx + 40; cyy += 48; }
    const s = `<rect x="${cx}" y="${cyy}" width="${w}" height="36" rx="18" fill="#ffffff" fill-opacity=".05" stroke="${BORDER}"/><text x="${cx + w / 2}" y="${cyy + 23.5}" class="chip">${esc(t)}</text>`;
    cx += w + 10;
    return s;
  }).join("");
  const D = `${tileRect(dx, cy0, half, rowH)}
  ${kicker(dx + 40, cy0 + 52, "Ask me about", VIOLET)}
  ${chips}
  ${wrap(`Also: ${a.also}`, 42).map((l, i) => `<text x="${dx + 40}" y="${cy0 + rowH - 34 - (wrap(`Also: ${a.also}`, 42).length - 1 - i) * 26}" class="s">${esc(l)}</text>`).join("")}`;

  write("about.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`${profile.name}, ${a.role} at ${a.company}, ${a.location}. ${a.intro}`)}">
  <title>About ${esc(profile.name)}</title>
  <defs>${GRADIENT}${CARD}<clipPath id="av"><circle cx="108" cy="112" r="60"/></clipPath></defs>
  <style>
    .k { font: 700 13px ${SANS}; letter-spacing: .18em; }
    .name { font: 800 44px ${SANS}; fill: #eef2ff; letter-spacing: -1.2px; }
    .role { font: 700 24px ${SANS}; letter-spacing: -.3px; }
    .s { font: 400 18px ${SANS}; fill: #8b98b5; }
    .b { font: 400 19px ${SANS}; fill: #b4c0da; }
    .f { font: 500 20px ${SANS}; fill: #dbe4ff; }
    .num { font: 800 17px ${SANS}; text-anchor: middle; }
    .big { font: 800 44px ${SANS}; letter-spacing: -1px; }
    .chip { font: 500 15.5px ${SANS}; fill: #d3dcf3; text-anchor: middle; }
  </style>
  ${A}
  ${B}
  ${C}
  ${D}
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
  if (profile.sections.about) await about();
  if (profile.sections.platform) await platform();
  for (const s of profile.stacks) await stackRow(s);
  for (const s of profile.socials) await social(s);
  cta("play", "Play with the 3D core", `<path d="M-6 -8 L9 0 L-6 8 Z" fill="${CYAN}"/>`);
  cta("star", "Leave your star in the galaxy", `<path d="M0 -10 Q0 0 10 0 Q0 0 0 10 Q0 0 -10 0 Q0 0 0 -10 Z" fill="#c4b5fd"/>`);
  divider();
  console.log(`assets: ${order.length} headers, ${profile.stacks.length} skill rows, ${profile.socials.length} socials -> assets/Design`);
}
