"use client";
import { useState } from "react";
import Board from "@/lib/board";
import { GAMES } from "@/lib/games";
import { Shell } from "@/lib/ui";

export default function BoardPage() {
  const [id, setId] = useState<string>(GAMES[0].id);
  return (
    <Shell title="Leaderboards">
      <div className="grid">
        {GAMES.map((g) => (
          <button key={g.id} className={g.id === id ? "" : "ghost"} onClick={() => setId(g.id)}>{g.icon} {g.name}</button>
        ))}
      </div>
      <Board key={id} game={id} />
    </Shell>
  );
}
