"use client";
import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { Shell, shuffle, useBest, useJSON, useSeed } from "@/lib/ui";
import Board from "@/lib/board";

type Border = { a: string; b: string; km: number; lines: number[][][] };
const ROUNDS = 8;
const W = 320;
const [LO, HI] = [Math.log(50), Math.log(8000)];
const toKm = (v: number) => Math.round(Math.exp(LO + (v / 100) * (HI - LO)));

export default function Length() {
  useSeed("length");
  const borders = useJSON<Border[]>("/data/borders.json");
  const [deck, setDeck] = useState<Border[]>([]);
  const [i, setI] = useState(0);
  const [v, setV] = useState(50);
  const [done, setDone] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, saveBest] = useBest("length");

  const cur = deck[i];
  const d = useMemo(() => {
    if (!cur) return "";
    const g = { type: "MultiLineString" as const, coordinates: cur.lines };
    return geoPath(geoMercator().fitExtent([[24, 24], [W - 24, W - 24]], g))(g) ?? "";
  }, [cur]);

  if (!borders) return <Shell title="Border Guesstimate">loading…</Shell>;
  if (!deck.length) { setDeck(shuffle(borders).slice(0, ROUNDS)); return null; }
  const over = i >= ROUNDS;
  if (over) saveBest(score);

  const go = (n: number) => { setI(n); setV(50); setDone(null); };
  const guess = () => {
    // factor-2 ke andar = 50pts, exact = 100
    const g = Math.max(0, Math.round(100 - Math.abs(Math.log2(toKm(v) / cur.km)) * 50));
    setDone(g); setScore(score + g);
  };

  return (
    <Shell title="Border Guesstimate" hud={`${Math.min(i + 1, ROUNDS)}/${ROUNDS} · ${score}pts · best ${best}`}>
      {over ? (
        <div className="card center">
          <h2>{score}/{ROUNDS * 100}</h2>
          <Board game="length" score={score} />
          <button onClick={() => { setDeck(shuffle(borders).slice(0, ROUNDS)); setScore(0); go(0); }}>Phir se</button>
        </div>
      ) : (
        <>
          <p className="dim"><b>{cur.a}</b> × <b>{cur.b}</b> ki border kitni lambi hai?</p>
          <svg viewBox={`0 0 ${W} ${W}`} className="map"><path d={d} className="glow" /></svg>
          <p className="answer">{toKm(v).toLocaleString()} km</p>
          <input type="range" min={0} max={100} value={v} disabled={done !== null} onChange={(e) => setV(+e.target.value)} />
          {done === null ? (
            <button onClick={guess}>Lock it</button>
          ) : (
            <>
              <p className="msg">Asli: {cur.km.toLocaleString()} km → +{done}</p>
              <button onClick={() => go(i + 1)}>Next →</button>
            </>
          )}
        </>
      )}
    </Shell>
  );
}
