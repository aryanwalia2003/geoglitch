"use client";
import { useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { mesh } from "topojson-client";
import type { Topology } from "topojson-specification";
import { Shell, buzz, norm, shuffle, useBest, useJSON, useSeed } from "@/lib/ui";
import Board from "@/lib/board";

type River = { name: string; km: number; coords: number[][] };
const ROUNDS = 8;
const DUR = 15; // seconds mein poori nadi draw
const W = 320;

export default function RiverRewind() {
  useSeed("river");
  const rivers = useJSON<River[]>("/data/rivers.json");
  const world = useJSON<Topology>("/data/world.json");
  const [deck, setDeck] = useState<River[]>([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [ctx, setCtx] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [gain, setGain] = useState<number | null>(null);
  const t0 = useRef(0);
  const [best, saveBest] = useBest("river");

  const cur = deck[i];
  const proj = useMemo(
    () => cur && geoMercator().fitExtent([[24, 24], [W - 24, W - 24]], { type: "LineString", coordinates: cur.coords }),
    [cur],
  );
  const d = useMemo(
    () => (cur && proj ? geoPath(proj)({ type: "LineString", coordinates: cur.coords }) ?? "" : ""),
    [cur, proj],
  );
  const borders = useMemo(
    () => (world && proj ? geoPath(proj)(mesh(world, world.objects.countries as never)) ?? "" : ""),
    [world, proj],
  );

  if (!rivers || !world) return <Shell title="River Rewind">loading…</Shell>;
  if (!deck.length) {
    setDeck(shuffle(rivers).slice(0, ROUNDS));
    t0.current = performance.now();
    return null;
  }
  const over = i >= ROUNDS;
  if (over) saveBest(score);
  const done = gain !== null;
  const names = rivers.map((r) => r.name).sort();
  const src = proj?.(cur?.coords[0] as [number, number]);
  const end = proj?.(cur?.coords.at(-1) as [number, number]);

  const go = (n: number) => {
    setI(n); setWrong(0); setCtx(false); setText(""); setMsg(""); setGain(null);
    t0.current = performance.now();
  };
  const next = () => go(i + 1);
  const restart = () => { setDeck(shuffle(rivers).slice(0, ROUNDS)); setScore(0); go(0); };

  const guess = () => {
    if (norm(text) !== norm(cur.name)) {
      buzz(80); setText("");
      if (wrong === 2) { setGain(0); return setMsg("💀 Out of tries"); }
      setWrong(wrong + 1);
      return setMsg("🔴 Galat — 15pts kate");
    }
    const prog = Math.min(1, (performance.now() - t0.current) / (DUR * 1000));
    const g = Math.max(10, Math.round(100 * (1 - prog)) - wrong * 15 - (ctx ? 25 : 0));
    setScore(score + g); setGain(g); setMsg("✅ Sahi!");
  };

  return (
    <Shell title="River Rewind" hud={`${Math.min(i + 1, ROUNDS)}/${ROUNDS} · ${score}pts · best ${best}`}>
      {over ? (
        <div className="card center">
          <h2>{score} pts</h2>
          <Board game="river" score={score} />
          <button onClick={restart}>Phir se</button>
        </div>
      ) : (
        <>
          <p className="dim">Nadi bah rahi hai — jaldi pehchan, points ghat rahe hain</p>
          <svg viewBox={`0 0 ${W} ${W}`} className="map">
            {ctx && <path d={borders} className="faint" />}
            <path
              key={i} d={d} pathLength={1} className="glow river"
              style={done ? { animation: "none", strokeDashoffset: 0 } : { animationDuration: `${DUR}s` }}
            />
            {src && <circle cx={src[0]} cy={src[1]} r={4} className="dot" />}
            {done && end && <circle cx={end[0]} cy={end[1]} r={4} className="dot end" />}
          </svg>
          {!done && (
            <>
              <datalist id="r">{names.map((n) => <option key={n} value={n} />)}</datalist>
              <input list="r" placeholder="Kaunsi nadi?" value={text} onChange={(e) => setText(e.target.value)} />
              <p className="msg">{msg}</p>
              <button onClick={guess}>Guess</button>
              <button className="ghost" disabled={ctx} onClick={() => setCtx(true)}>Borders dikha (−25)</button>
            </>
          )}
          {done && (
            <>
              <p className="msg">{msg} {gain! > 0 && `+${gain}`}</p>
              <p className="answer">{cur.name}</p>
              <button onClick={next}>Next →</button>
            </>
          )}
        </>
      )}
    </Shell>
  );
}
