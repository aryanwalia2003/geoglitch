"use client";
import { useEffect, useState } from "react";
import { Shell, buzz, useBest, useJSON, useSeed, rand } from "@/lib/ui";
import Board from "@/lib/board";

type S = { name: string; lat: number; lon: number; area: number };
const TIME = 30;
const QUAD = ["NW", "NE", "SW", "SE"];
const quad = (c: S) => (c.lat > 0 ? "N" : "S") + (c.lon > 0 ? "E" : "W");

export default function Blitz() {
  useSeed("blitz");
  const stats = useJSON<S[]>("/data/stats.json");
  const [cur, setCur] = useState<S>();
  const [left, setLeft] = useState(0); // 0 = idle/over
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState("");
  const [best, saveBest] = useBest("blitz");

  const pool = (stats ?? []).filter((s) => s.area > 20000 && Math.abs(s.lat) > 6 && Math.abs(s.lon) > 6); // seema ke paas wale hata do
  const draw = () => setCur(pool[Math.floor(rand() * pool.length)]);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => Math.max(0, +(l - 0.1).toFixed(1))), 100);
    return () => clearTimeout(t);
  }, [left]);
  useEffect(() => { if (left === 0 && score) saveBest(score); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stats) return <Shell title="Quadrant Blitz">loading…</Shell>;
  const playing = left > 0;

  const answer = (q: string) => {
    if (q === quad(cur!)) { setScore(score + 1); setFlash("✅"); }
    else { buzz(80); setLeft(Math.max(0.1, left - 2)); setFlash("❌ −2s"); }
    draw();
  };

  return (
    <Shell title="Quadrant Blitz" hud={`⏱ ${left.toFixed(0)}s · ${score}pts · best ${best}`}>
      {!playing ? (
        <div className="card center">
          {score > 0 && <h2>{score} desh in {TIME}s</h2>}
          {score > 0 && <Board game="blitz" score={score} />}
          <p className="dim">Desh ka naam dikhega. Bata wo kis quadrant mein hai: N/S × E/W (equator aur prime meridian ke hisaab se). Galat = −2s.</p>
          <button onClick={() => { setScore(0); setFlash(""); draw(); setLeft(TIME); }}>{score > 0 ? "Phir se" : "Start"}</button>
        </div>
      ) : (
        <>
          <div className="card center"><b className="answer">{cur!.name}</b></div>
          <p className="msg">{flash}</p>
          <div className="grid">
            {QUAD.map((q) => <button key={q} className="big" onClick={() => answer(q)}><b>{q}</b></button>)}
          </div>
        </>
      )}
    </Shell>
  );
}
