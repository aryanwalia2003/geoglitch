"use client";
import { useMemo } from "react";
import { Shell, shuffle, useJSON, useSeed, rand } from "@/lib/ui";
import { Quiz, type Q } from "@/lib/quiz";

type B = { a: string; b: string };
const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];

function gen(g: Map<string, Set<string>>): Q {
  const names = [...g.keys()];
  for (;;) {
    const a = pick(names);
    const b = pick([...g.get(a)!]);
    const common = [...g.get(a)!].filter((x) => g.get(b)!.has(x));
    if (!common.length) continue;
    const ans = pick(common);
    // decoy: A ya B ke padosi jo dono ke saath nahi lagte (plausible), phir random
    const near = shuffle([...g.get(a)!, ...g.get(b)!].filter((x) => x !== a && x !== b && !common.includes(x)));
    const decoys = [...new Set([...near, ...shuffle(names)])].filter((x) => x !== a && x !== b && !common.includes(x)).slice(0, 3);
    return {
      head: `${a} + ${b}`,
      prompt: "Dono jis ek desh se border share karte hain, wo kaun?",
      options: shuffle([ans, ...decoys]),
      answer: ans,
      info: `Common padosi: ${common.join(", ")}`,
    };
  }
}

export default function Trio() {
  useSeed("trio");
  const borders = useJSON<B[]>("/data/borders.json");
  const g = useMemo(() => {
    const m = new Map<string, Set<string>>();
    borders?.forEach(({ a, b }) => {
      (m.get(a) ?? m.set(a, new Set()).get(a)!).add(b);
      (m.get(b) ?? m.set(b, new Set()).get(b)!).add(a);
    });
    return m;
  }, [borders]);
  if (!borders) return <Shell title="Shared Neighbour">loading…</Shell>;
  return <Quiz title="Shared Neighbour" id="trio" gen={() => gen(g)} />;
}
