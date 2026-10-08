"use client";
import { useMemo, useState } from "react";
import { Shell, buzz, shuffle, useBest, useJSON, useSeed } from "@/lib/ui";
import Board from "@/lib/board";

type S = { name: string; area: number; anti: string | null };
const ROUNDS = 10;
const OCEAN = "🌊 Ocean";

export default function Antipode() {
  useSeed("antipode");
  const stats = useJSON<S[]>("/data/stats.json");
  const [deck, setDeck] = useState<S[]>([]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [best, saveBest] = useBest("antipode");

  const big = useMemo(() => (stats ?? []).filter((s) => s.area > 5000), [stats]); // chhote territories nikaalo
  const cur = deck[i];
  const ans = cur?.anti ?? OCEAN;
  // options round ke hisaab se ek baar fix
  const opts = useMemo(
    () => (cur ? shuffle([...new Set([ans, OCEAN, ...shuffle(big.map((b) => b.name).filter((n) => n !== ans))])].slice(0, 4)) : []),
    [cur], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!stats) return <Shell title="Antipode">loading…</Shell>;
  const mk = () => {
    // aadhe round land-hit (crazy wale), aadhe ocean
    const land = shuffle(big.filter((s) => s.anti && big.some((b) => b.name === s.anti))).slice(0, ROUNDS / 2);
    const sea = shuffle(big.filter((s) => !s.anti)).slice(0, ROUNDS / 2);
    return shuffle([...land, ...sea]);
  };
  if (!deck.length) { setDeck(mk()); return null; }

  const over = i >= ROUNDS;
  if (over) saveBest(score);

  const choose = (o: string) => {
    if (pick) return;
    setPick(o);
    if (o === ans) setScore(score + 1); else buzz(120);
  };

  return (
    <Shell title="Antipode" hud={`${Math.min(i + 1, ROUNDS)}/${ROUNDS} · ${score}pts · best ${best}`}>
      {over ? (
        <div className="card center">
          <h2>{score}/{ROUNDS}</h2>
          <Board game="antipode" score={score} />
          <button onClick={() => { setDeck(mk()); setScore(0); setI(0); setPick(null); }}>Phir se</button>
        </div>
      ) : (
        <>
          <p className="dim">{cur.name} ke center se seedha zameen ke aar-paar khod. Dusri taraf kya nikalega?</p>
          <div className="card center"><b className="answer">⛏️ {cur.name}</b></div>
          {opts.map((o) => (
            <button key={o} className={`big ${pick && (o === ans ? "ok" : pick === o ? "bad" : "")}`} onClick={() => choose(o)}>
              <b>{o}</b>
            </button>
          ))}
          {pick && <button onClick={() => { setI(i + 1); setPick(null); }}>Next →</button>}
        </>
      )}
    </Shell>
  );
}
