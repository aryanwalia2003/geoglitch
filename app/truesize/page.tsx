"use client";
import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { Feature } from "geojson";
import { Shell, buzz, useBest, useJSON, useSeed, rand } from "@/lib/ui";
import Board from "@/lib/board";

type S = { name: string; area: number };
const W = 160;
const rnd = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];

export default function TrueSize() {
  useSeed("truesize");
  const world = useJSON<Topology>("/data/world.json");
  const stats = useJSON<S[]>("/data/stats.json");
  const [pair, setPair] = useState<[Feature, Feature]>();
  const [picked, setPicked] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, saveBest] = useBest("truesize");

  // 110m wale desh jinka area pata hai
  const pool = useMemo(() => {
    if (!world || !stats) return [];
    const area = new Map(stats.map((s) => [s.name, s.area]));
    return (feature(world, world.objects.countries as never) as unknown as { features: Feature[] }).features
      .map((f) => ({ f, a: area.get(f.properties!.name) ?? 0 }))
      .filter((x) => x.a > 20000);
  }, [world, stats]);

  const draw = () => {
    for (;;) {
      const x = rnd(pool), y = rnd(pool);
      const ratio = Math.max(x.a, y.a) / Math.min(x.a, y.a);
      if (x !== y && ratio > 1.15 && ratio < 3) return setPair([x.f, y.f]);
    }
  };
  useEffect(() => { if (pool.length && !pair) draw(); }, [pool]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (picked === null || !pair) return;
    if (!ok(pair, picked, stats!)) return;
    const t = setTimeout(() => { setPicked(null); draw(); }, 1400);
    return () => clearTimeout(t);
  }, [picked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pair || !stats) return <Shell title="True Size">loading…</Shell>;
  const area = (f: Feature) => stats.find((s) => s.name === f.properties!.name)!.area;
  const dead = picked !== null && !ok(pair, picked, stats);

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (ok(pair, i, stats)) { setStreak(streak + 1); saveBest(streak + 1); } else buzz(120);
  };

  return (
    <Shell title="True Size" hud={`🔥 ${streak} · best ${best}`}>
      <p className="dim">Dono ko same box mein fit kiya hai. Asli mein kaun bada hai?</p>
      <div className="duo">
        {pair.map((f, i) => {
          const p = geoMercator().fitExtent([[10, 10], [W - 10, W - 10]], f);
          const win = picked !== null && area(f) === Math.max(...pair.map(area));
          return (
            <button key={i} onClick={() => pick(i)} className={`big sil ${picked !== null && (win ? "ok" : picked === i ? "bad" : "")}`}>
              <svg viewBox={`0 0 ${W} ${W}`}><path d={geoPath(p)(f) ?? ""} className="solid" /></svg>
              <b>{picked !== null ? f.properties!.name : "?"}</b>
              <span>{picked !== null ? area(f).toLocaleString() + " km²" : ""}</span>
            </button>
          );
        })}
      </div>
      {dead && (
        <>
          <p className="msg">💀 Streak khatam: {streak}</p>
          <Board game="truesize" score={streak} />
          <button onClick={() => { setStreak(0); setPicked(null); draw(); }}>Phir se</button>
        </>
      )}
    </Shell>
  );
}

const ok = (pair: [Feature, Feature], i: number, stats: S[]) => {
  const a = pair.map((f) => stats.find((s) => s.name === f.properties!.name)!.area);
  return a[i] === Math.max(...a);
};
