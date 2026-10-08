"use client";
import { Shell, shuffle, useJSON, useSeed, rand } from "@/lib/ui";
import { Quiz, type Q } from "@/lib/quiz";

type S = { name: string; lon: number; area: number };
const gap = (a: number, b: number) => Math.abs(a - b); // lon -180..180, target bhi wahi range

function gen(cs: S[]): Q {
  for (;;) {
    const h = Math.floor(rand() * 24);
    const t = (((12 - h) * 15 + 540) % 360) - 180; // solar noon ka longitude
    const four = shuffle(cs).slice(0, 4).sort((a, b) => gap(a.lon, t) - gap(b.lon, t));
    // jawab saaf ho: sabse paas wala 12° ke andar, dusra 20°+ door
    if (gap(four[0].lon, t) < 12 && gap(four[1].lon, t) - gap(four[0].lon, t) > 20)
      return {
        head: `🕛 ${String(h).padStart(2, "0")}:00 UTC`,
        prompt: "Abhi suraj theek sar pe hai. Kaunsa desh us line ke sabse paas hai?",
        options: shuffle(four.map((c) => c.name)),
        answer: four[0].name,
        info: `Solar noon ≈ ${Math.abs(t)}°${t < 0 ? "W" : "E"}`,
      };
  }
}

export default function Sun() {
  useSeed("sun");
  const stats = useJSON<S[]>("/data/stats.json");
  if (!stats) return <Shell title="Sunrise Roulette">loading…</Shell>;
  const cs = stats.filter((s) => s.area > 20000);
  return <Quiz title="Sunrise Roulette" id="sun" gen={() => gen(cs)} />;
}
