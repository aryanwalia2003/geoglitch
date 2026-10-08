"use client";
import { useMemo, useState } from "react";
import { Shell, buzz, useBest, useJSON, useSeed, rand } from "@/lib/ui";
import Board from "@/lib/board";

type B = { a: string; b: string };
const ROUNDS = 5;

// BFS: har desh ki start se doori
function dists(g: Map<string, string[]>, s: string) {
  const d = new Map([[s, 0]]);
  for (const q = [s]; q.length; ) {
    const x = q.shift()!;
    for (const y of g.get(x) ?? []) if (!d.has(y)) { d.set(y, d.get(x)! + 1); q.push(y); }
  }
  return d;
}

function pickRound(g: Map<string, string[]>) {
  const names = [...g.keys()];
  for (;;) {
    const s = names[Math.floor(rand() * names.length)];
    const far = [...dists(g, s)].filter(([, n]) => n >= 3 && n <= 6);
    if (far.length) { const [t, opt] = far[Math.floor(rand() * far.length)]; return { s, t, opt }; }
  }
}

export default function Hops() {
  useSeed("hops");
  const borders = useJSON<B[]>("/data/borders.json");
  const g = useMemo(() => {
    const m = new Map<string, string[]>();
    borders?.forEach(({ a, b }) => { m.set(a, [...(m.get(a) ?? []), b]); m.set(b, [...(m.get(b) ?? []), a]); });
    return m;
  }, [borders]);
  const [r, setR] = useState<ReturnType<typeof pickRound>>();
  const [path, setPath] = useState<string[]>([]);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [gain, setGain] = useState<number | null>(null);
  const [best, saveBest] = useBest("hops");

  if (!borders) return <Shell title="Border Hops">loading…</Shell>;
  if (!r) { const x = pickRound(g); setR(x); setPath([x.s]); return null; }

  const cur = path.at(-1)!;
  const over = n >= ROUNDS;
  if (over) saveBest(score);

  const start = (round: number) => { const x = pickRound(g); setR(x); setPath([x.s]); setGain(null); setN(round); };
  const hop = (c: string) => {
    setPath([...path, c]);
    if (c === r.t) {
      // optimal/moves — jitna seedha utne points
      const gn = Math.round((r.opt / path.length) * 100);
      setScore(score + gn); setGain(gn);
    } else if (path.length > r.opt * 3) { buzz(80); }
  };

  return (
    <Shell title="Border Hops" hud={`${Math.min(n + 1, ROUNDS)}/${ROUNDS} · ${score}pts · best ${best}`}>
      {over ? (
        <div className="card center">
          <h2>{score} pts</h2>
          <Board game="hops" score={score} />
          <button onClick={() => { setScore(0); start(0); }}>Phir se</button>
        </div>
      ) : (
        <>
          <p className="dim">Sirf land border cross karke pahunch. Kam hops = zyada points.</p>
          <div className="card center">
            <span className="dim">Target</span>
            <b className="answer">🎯 {r.t}</b>
            <span className="dim">{path.join(" → ")}</span>
          </div>
          {gain !== null ? (
            <>
              <p className="msg">✅ {path.length - 1} hops (best {r.opt}) +{gain}</p>
              <button onClick={() => start(n + 1)}>Next →</button>
            </>
          ) : (
            <div className="grid">
              {[...(g.get(cur) ?? [])].sort().filter((c) => !path.includes(c)).map((c) => (
                <button key={c} className="ghost" onClick={() => hop(c)}>{c}</button>
              ))}
            </div>
          )}
          {gain === null && <button className="ghost" onClick={() => start(n + 1)}>Skip (0)</button>}
        </>
      )}
    </Shell>
  );
}
