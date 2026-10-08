"use client";
import { useEffect, useState } from "react";
import { Shell, buzz, useBest, useJSON, useSeed, rand } from "@/lib/ui";
import Board from "@/lib/board";

type C = { name: string; area: number; neighbours: number; lat: number; lon: number; pieces: number };
type M = { k: keyof C; q: string; fmt: (v: number) => string };

const METRICS: M[] = [
  { k: "area", q: "kiska area BADA hai?", fmt: (v) => v.toLocaleString() + " km²" },
  { k: "neighbours", q: "kiske land neighbours ZYADA hain?", fmt: (v) => String(v) },
  { k: "lat", q: "kaun zyada NORTH mein hai?", fmt: (v) => `${Math.abs(v)}°${v < 0 ? "S" : "N"}` },
  { k: "lon", q: "kaun zyada EAST mein hai?", fmt: (v) => `${Math.abs(v)}°${v < 0 ? "W" : "E"}` },
  { k: "pieces", q: "kaun zyada alag-alag land pieces (islands) mein bata hua hai?", fmt: (v) => String(v) },
];
const rnd = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];

// ek round: metric + do countries jinki value alag ho
function round(cs: C[], left?: C) {
  for (;;) {
    const m = rnd(METRICS);
    const a = left ?? rnd(cs);
    const b = rnd(cs);
    if (a !== b && a[m.k] !== b[m.k]) return { m, a, b };
  }
}

export default function Higher() {
  useSeed("higher");
  const cs = useJSON<C[]>("/data/stats.json");
  const [r, setR] = useState<ReturnType<typeof round>>();
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, saveBest] = useBest("higher");

  useEffect(() => { if (cs && !r) setR(round(cs)); }, [cs, r]);
  // sahi jawab ke baad auto-next, jeetne wala left pe
  useEffect(() => {
    if (!picked || !r || !cs) return;
    const ok = picked === win(r);
    if (!ok) return;
    const t = setTimeout(() => { setR(round(cs, r[win(r)])); setPicked(null); }, 1100);
    return () => clearTimeout(t);
  }, [picked, r, cs]);

  if (!cs || !r) return <Shell title="Weird Higher/Lower">loading…</Shell>;
  const dead = picked !== null && picked !== win(r);

  const pick = (p: "a" | "b") => {
    if (picked) return;
    setPicked(p);
    if (p === win(r)) { setStreak(streak + 1); saveBest(streak + 1); } else buzz(120);
  };
  const again = () => { setStreak(0); setPicked(null); setR(round(cs)); };

  return (
    <Shell title="Weird Higher/Lower" hud={`🔥 ${streak} · best ${best}`}>
      <p className="dim">{r.m.q}</p>
      {(["a", "b"] as const).map((s) => (
        <button
          key={s} onClick={() => pick(s)}
          className={`big ${picked && (s === win(r) ? "ok" : picked === s ? "bad" : "")}`}
        >
          <b>{r[s].name}</b>
          <span>{s === "a" || picked ? r.m.fmt(r[s][r.m.k] as number) : "?"}</span>
        </button>
      ))}
      {dead && (
        <>
          <p className="msg">💀 Streak khatam: {streak}</p>
          <Board game="higher" score={streak} />
          <button onClick={again}>Phir se</button>
        </>
      )}
    </Shell>
  );
}

const win = (r: NonNullable<ReturnType<typeof round>>) => ((r.a[r.m.k] as number) > (r.b[r.m.k] as number) ? "a" : "b");
