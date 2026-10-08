"use client";
import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { Shell, buzz, norm, shuffle, useBest, useJSON, useSeed } from "@/lib/ui";
import Board from "@/lib/board";

type Border = { a: string; b: string; km: number; lines: number[][][] };
const ROUNDS = 10;
const W = 320;

export default function BorderBlind() {
  useSeed("border");
  const borders = useJSON<Border[]>("/data/borders.json");
  const stats = useJSON<{ name: string }[]>("/data/stats.json");
  const [deck, setDeck] = useState<Border[]>([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [tries, setTries] = useState(0);
  const [pick, setPick] = useState(["", ""]);
  const [msg, setMsg] = useState("");
  const [reveal, setReveal] = useState(false);
  const [best, saveBest] = useBest("border");

  const cur = deck[i];
  const d = useMemo(() => {
    if (!cur) return "";
    const g = { type: "MultiLineString" as const, coordinates: cur.lines };
    return geoPath(geoMercator().fitExtent([[24, 24], [W - 24, W - 24]], g))(g) ?? "";
  }, [cur]);

  if (!borders || !stats) return <Shell title="Border Blind">loading…</Shell>;
  if (!deck.length) {
    setDeck(shuffle(borders).slice(0, ROUNDS));
    return null;
  }

  const over = i >= ROUNDS;
  if (over) saveBest(score);

  const go = (n: number) => {
    setI(n); setTries(0); setPick(["", ""]); setMsg(""); setReveal(false);
  };
  const next = () => go(i + 1);
  const restart = () => {
    setDeck(shuffle(borders).slice(0, ROUNDS)); setScore(0); go(0);
  };

  const guess = () => {
    const [x, y] = pick.map(norm);
    if (!x || !y || x === y) return setMsg("Do alag countries daal");
    const hit = [norm(cur.a), norm(cur.b)];
    const n = hit.filter((h) => h === x || h === y).length;
    if (n === 2) { setScore(score + 3 - tries); setReveal(true); return setMsg("✅ Sahi!"); }
    buzz(80);
    if (tries === 2) { setReveal(true); return setMsg("💀 Out of tries"); }
    setTries(tries + 1);
    setMsg(n === 1 ? "🟡 Ek country sahi hai!" : "🔴 Dono galat");
  };

  const names = stats.map((s) => s.name).sort();

  return (
    <Shell title="Border Blind" hud={`${Math.min(i + 1, ROUNDS)}/${ROUNDS} · ${score}pts · best ${best}`}>
      {over ? (
        <div className="card center">
          <h2>{score}/{ROUNDS * 3}</h2>
          <Board game="border" score={score} />
          <button onClick={restart}>Phir se</button>
        </div>
      ) : (
        <>
          <p className="dim">Ye kin do countries ki border hai?</p>
          <svg viewBox={`0 0 ${W} ${W}`} className="map">
            <path d={d} className="glow" />
          </svg>
          {tries > 0 && <p className="dim">Hint: border {cur.km.toLocaleString()} km lambi</p>}
          <datalist id="c">{names.map((n) => <option key={n} value={n} />)}</datalist>
          {[0, 1].map((k) => (
            <input
              key={k} list="c" placeholder={`Country ${k + 1}`} value={pick[k]} disabled={reveal}
              onChange={(e) => setPick(pick.map((p, j) => (j === k ? e.target.value : p)))}
            />
          ))}
          <p className="msg">{msg}</p>
          {reveal ? (
            <>
              <p className="answer">{cur.a} × {cur.b}</p>
              <button onClick={next}>Next →</button>
            </>
          ) : (
            <button onClick={guess}>Guess ({3 - tries} left)</button>
          )}
        </>
      )}
    </Shell>
  );
}
