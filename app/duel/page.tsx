"use client";
import { Shell, shuffle, useJSON, useSeed } from "@/lib/ui";
import { Quiz, type Q } from "@/lib/quiz";

type S = { name: string; lat: number; lon: number; area: number };
const rad = Math.PI / 180;
// centroid-to-centroid haversine (km)
const km = (a: S, b: S) => {
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return Math.round(12742 * Math.asin(Math.sqrt(h)));
};

function gen(cs: S[]): Q {
  for (;;) {
    const [a, b, c, d] = shuffle(cs).slice(0, 4);
    const [x, y] = [km(a, b), km(c, d)];
    if (Math.max(x, y) / Math.min(x, y) < 1.25) continue;
    const p = [`${a.name} ↔ ${b.name}`, `${c.name} ↔ ${d.name}`];
    return {
      head: "⚔️ Kaunsi jodi zyada door?",
      prompt: "Dono ke centers ke beech seedhi doori.",
      options: p,
      answer: x > y ? p[0] : p[1],
      info: `${x.toLocaleString()} km vs ${y.toLocaleString()} km`,
    };
  }
}

export default function Duel() {
  useSeed("duel");
  const stats = useJSON<S[]>("/data/stats.json");
  if (!stats) return <Shell title="Distance Duel">loading…</Shell>;
  const cs = stats.filter((s) => s.area > 20000);
  return <Quiz title="Distance Duel" id="duel" gen={() => gen(cs)} />;
}
