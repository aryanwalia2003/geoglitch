"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { byId, today } from "./games";

// ek baar fetch, memory mein cache
const cache = new Map<string, Promise<unknown>>();
export function useJSON<T>(url: string): T | null {
  const [d, setD] = useState<T | null>(null);
  useEffect(() => {
    if (!cache.has(url)) cache.set(url, fetch(url).then((r) => r.json()));
    (cache.get(url) as Promise<T>).then(setD);
  }, [url]);
  return d;
}

// ---- randomness: daily mode mein seeded (aaj ke sawal sabke liye same) ----
let rng: () => number = Math.random;
export const rand = () => rng();

const mulberry32 = (a: number) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

export type Mode = "daily" | "free";
export const getMode = (): Mode => {
  try { return localStorage.getItem("mode") === "daily" ? "daily" : "free"; } catch { return "free"; }
};
export const setMode = (m: Mode) => { try { localStorage.setItem("mode", m); } catch {} };

// game page mount pe ek baar: seed set (daily) ya reset (free)
export function useSeed(game: string) {
  useState(() => {
    const g = byId(game);
    rng = getMode() === "daily" && g?.daily ? mulberry32(hash(`${today()}:${game}`)) : Math.random;
  });
}

export const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

// accents/case/spaces hata ke compare
export const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export const buzz = (ms: number | number[]) => navigator.vibrate?.(ms);

export function useBest(game: string): [number, (n: number) => void] {
  const [best, setBest] = useState(0);
  useEffect(() => {
    try { setBest(Number(localStorage.getItem("best:" + game)) || 0); } catch {}
  }, [game]);
  return [
    best,
    (n) => {
      if (n <= best) return;
      setBest(n);
      try { localStorage.setItem("best:" + game, String(n)); } catch {}
    },
  ];
}

export function Shell({ title, hud, children }: { title: string; hud?: ReactNode; children: ReactNode }) {
  return (
    <main className="shell">
      <header className="bar">
        <Link href="/" aria-label="Back">←</Link>
        <h1>{title}</h1>
        <span className="hud">{hud}</span>
      </header>
      {children}
    </main>
  );
}
