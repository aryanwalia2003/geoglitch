// Build-time data: borders, stats, rivers -> public/data/*.json
import fs from "node:fs";
import { createRequire } from "node:module";
import { geoArea, geoCentroid, geoContains, geoLength } from "d3-geo";
import * as topo from "topojson-client";

const require = createRequire(import.meta.url);
const R = 6371;
const world = require("world-atlas/countries-50m.json");
const land = require("world-atlas/land-50m.json");
const out = (f, d) => {
  fs.mkdirSync("public/data", { recursive: true });
  fs.writeFileSync(`public/data/${f}.json`, JSON.stringify(d));
  console.log(f, (fs.statSync(`public/data/${f}.json`).size / 1024).toFixed(0) + "KB");
};
const q = (c) => [Math.round(c[0] * 100) / 100, Math.round(c[1] * 100) / 100];
const quantLine = (l) => l.map(q).filter((p, i, a) => !i || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);

// naam chhote karo (guess karne layak)
const RENAME = {
  "United States of America": "United States", "Dem. Rep. Congo": "DR Congo", "Central African Rep.": "Central African Republic",
  "Dominican Rep.": "Dominican Republic", "Bosnia and Herz.": "Bosnia & Herzegovina", "S. Sudan": "South Sudan",
  "Eq. Guinea": "Equatorial Guinea", "W. Sahara": "Western Sahara", "Czechia": "Czech Republic", "eSwatini": "Eswatini",
  "N. Cyprus": "Northern Cyprus", "Solomon Is.": "Solomon Islands", "Falkland Is.": "Falkland Islands",
};
const SKIP = new Set(["Antarctica", "Fr. S. Antarctic Lands", "Somaliland", "N. Cyprus"]);

const geoms = world.objects.countries.geometries.filter((g) => !SKIP.has(g.properties.name));
geoms.forEach((g) => (g.properties.name = RENAME[g.properties.name] ?? g.properties.name));
const nbrs = topo.neighbors(geoms);

// ---- Stats (Weird Higher/Lower) ----
const feats = geoms.map((g) => topo.feature(world, g));
const stats = feats.map((f, i) => {
  const [lon, lat] = geoCentroid(f);
  return {
    name: f.properties.name,
    area: Math.round(geoArea(f) * R * R),
    neighbours: nbrs[i].length,
    lat: Math.round(lat * 10) / 10,
    lon: Math.round(lon * 10) / 10,
    pieces: f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.length : 1,
    anti: feats.find((g) => geoContains(g, [lon + 180 > 180 ? lon - 180 : lon + 180, -lat]))?.properties.name ?? null, // antipode kis desh pe
  };
});
out("stats", stats);

// ---- Borders (Border Blind) ----
const col = { type: "GeometryCollection", geometries: geoms };
const borders = [];
nbrs.forEach((list, i) =>
  list.forEach((j) => {
    if (j < i) return;
    const m = topo.mesh(world, col, (a, b) => (a === geoms[i] && b === geoms[j]) || (a === geoms[j] && b === geoms[i]));
    const km = geoLength(m) * R;
    if (km < 120) return; // bahut chhoti border = boring
    borders.push({ a: geoms[i].properties.name, b: geoms[j].properties.name, km: Math.round(km), lines: m.coordinates.map(quantLine) });
  }),
);
out("borders", borders);

// ---- Rivers (River Rewind) ----
const rf = JSON.parse(fs.readFileSync("data/rivers50.geojson", "utf8")).features.filter((f) => f.properties.featurecla === "River");
const byName = {};
for (const f of rf) {
  const n = f.properties.name_en || f.properties.name;
  (byName[n] ??= []).push(...(f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates]));
}
const key = (p) => p.join(",");
function stitch(lines) {
  let chains = lines.map((l) => [...l]);
  for (let merged = true; merged; ) {
    merged = false;
    outer: for (let i = 0; i < chains.length; i++)
      for (let j = 0; j < chains.length; j++) {
        if (i === j) continue;
        const a = chains[i], b = chains[j];
        if (key(a.at(-1)) === key(b[0])) { chains[i] = [...a, ...b.slice(1)]; chains.splice(j, 1); merged = true; break outer; }
        if (key(a.at(-1)) === key(b.at(-1))) { chains[i] = [...a, ...b.reverse().slice(1)]; chains.splice(j, 1); merged = true; break outer; }
        if (key(a[0]) === key(b[0])) { chains[i] = [...a.reverse(), ...b.slice(1)]; chains.splice(j, 1); merged = true; break outer; }
      }
  }
  return chains.sort((x, y) => len(y) - len(x))[0];
}
const len = (c) => geoLength({ type: "LineString", coordinates: c }) * R;
// coast ke vertices -> mouth pehchano (coast ke paas wala end)
const coast = [];
topo.feature(land, land.objects.land).features.forEach((f) =>
  (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.flat() : f.geometry.coordinates).forEach((r) => coast.push(...r)),
);
const dCoast = ([x, y]) => {
  let m = 1e9;
  const k = Math.cos((y * Math.PI) / 180);
  for (const [cx, cy] of coast) { const d = ((cx - x) * k) ** 2 + (cy - y) ** 2; if (d < m) m = d; }
  return m;
};
const RIVER_RENAME = { Huang: "Yellow River", Amazonas: "Amazon", "Amu  Darya": "Amu Darya", Ayeyarwady: "Irrawaddy", Nu: "Salween", "Godävari": "Godavari", Yenisey: "Yenisei", Yamuna: "Yamuna", Paraná: "Parana" };
const rivers = Object.entries(byName)
  .map(([name, lines]) => ({ name, c: stitch(lines) }))
  .map((r) => ({ ...r, km: len(r.c) }))
  .filter((r) => r.km > 900)
  .map((r) => (dCoast(r.c[0]) < dCoast(r.c.at(-1)) ? { ...r, c: r.c.reverse() } : r)) // source -> mouth
  .sort((a, b) => b.km - a.km)
  .slice(0, 45)
  .map((r) => ({ name: RIVER_RENAME[r.name] ?? r.name, km: Math.round(r.km), coords: quantLine(r.c) }));
out("rivers", rivers);
console.log(rivers.map((r) => r.name + " " + r.km).join(" | "));

// background ke liye halka world map
const w110 = structuredClone(require("world-atlas/countries-110m.json"));
w110.objects.countries.geometries.forEach((g) => (g.properties.name = RENAME[g.properties.name] ?? g.properties.name));
out("world", w110);
