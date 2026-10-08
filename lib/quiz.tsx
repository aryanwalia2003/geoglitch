"use client";
import { useState } from "react";
import { Shell, buzz, useBest } from "./ui";
import Board from "./board";

export type Q = { head: string; prompt: string; options: string[]; answer: string; info?: string };

// multiple-choice rounds ka shared dhancha
export function Quiz({ title, id, gen, rounds = 10 }: { title: string; id: string; gen: () => Q; rounds?: number }) {
  const make = () => Array.from({ length: rounds }, gen);
  const [qs, setQs] = useState(make);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [best, saveBest] = useBest(id);

  const over = i >= rounds;
  if (over) saveBest(score);
  const q = qs[i];

  const choose = (o: string) => {
    if (pick) return;
    setPick(o);
    if (o === q.answer) setScore(score + 1); else buzz(120);
  };

  return (
    <Shell title={title} hud={`${Math.min(i + 1, rounds)}/${rounds} · ${score}pts · best ${best}`}>
      {over ? (
        <div className="card center">
          <h2>{score}/{rounds}</h2>
          <Board game={id} score={score} />
          <button onClick={() => { setQs(make()); setI(0); setScore(0); setPick(null); }}>Phir se</button>
        </div>
      ) : (
        <>
          <p className="dim">{q.prompt}</p>
          <div className="card center"><b className="answer">{q.head}</b></div>
          {q.options.map((o) => (
            <button key={o} className={`big ${pick && (o === q.answer ? "ok" : pick === o ? "bad" : "")}`} onClick={() => choose(o)}>
              <b>{o}</b>
            </button>
          ))}
          {pick && (
            <>
              {q.info && <p className="msg">{q.info}</p>}
              <button onClick={() => { setI(i + 1); setPick(null); }}>Next →</button>
            </>
          )}
        </>
      )}
    </Shell>
  );
}
