// Logo lookup shared by the asset generators.
// An icon spec is "skill:<id>" (skillicons.dev, dark theme) or "si:<simple-icons export>[:hex]".
import * as si from "simple-icons";

const cache = new Map();
let uid = 0;

async function load(spec) {
  if (cache.has(spec)) return cache.get(spec);
  const [kind, id, hex] = spec.split(":");
  let logo;
  if (kind === "skill") {
    const res = await fetch(`https://skillicons.dev/icons?i=${id}&theme=dark`);
    const svg = await res.text();
    if (!res.ok || !svg.includes("<svg")) throw new Error(`skillicons.dev has no icon "${id}" (from "${spec}")`);
    // the response wraps one 256x256 icon in an outer <svg>; keep what's inside it
    logo = { body: svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, ""), plate: false };
  } else if (kind === "si") {
    const icon = si[id];
    if (!icon) throw new Error(`simple-icons has no export "${id}" (from "${spec}"); names look like siGooglebigquery`);
    // simple-icons draw in a 24x24 box; scale into the same 160px safe area skillicons uses
    logo = { body: `<g transform="translate(48 48) scale(6.6667)"><path fill="#${hex ?? icon.hex}" d="${icon.path}"/></g>`, plate: true };
  } else {
    throw new Error(`icon "${spec}" must start with "skill:" or "si:"`);
  }
  cache.set(spec, logo);
  return logo;
}

// Prefix every id inside an embedded logo so gradients from different logos never collide.
function scopeIds(body) {
  const p = `l${uid++}-`;
  return body.replace(/id="([^"]+)"/g, `id="${p}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`).replace(/href="#([^"]+)"/g, `href="#${p}$1"`);
}

// A logo as a rounded tile of the given size at (x, y).
export async function tile(spec, x, y, size) {
  const { body, plate } = await load(spec);
  return `<g transform="translate(${x} ${y}) scale(${size / 256})">
      ${plate ? `<rect width="256" height="256" rx="60" fill="#242938"/>` : ""}
      ${scopeIds(body)}
    </g>`;
}
