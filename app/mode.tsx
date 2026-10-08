"use client";
import { useEffect, useState } from "react";
import { getMode, setMode, type Mode } from "@/lib/ui";

export default function ModeToggle() {
  const [m, setM] = useState<Mode>("free");
  useEffect(() => setM(getMode()), []);
  const flip = (x: Mode) => { setMode(x); setM(x); };
  return (
    <div className="tabs">
      <button className={m === "daily" ? "" : "ghost"} onClick={() => flip("daily")}>📅 Daily</button>
      <button className={m === "free" ? "" : "ghost"} onClick={() => flip("free")}>🎲 Free</button>
      <p className="dim">{m === "daily" ? "Aaj ke sawal sabke liye same. Leaderboard pe Aaj ka board." : "Har baar naye random sawal."}</p>
    </div>
  );
}
