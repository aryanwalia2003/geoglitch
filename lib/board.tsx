"use client";
import { useEffect, useState } from "react";
import { byId } from "./games";
import { getMode } from "./ui";

type Row = { name: string; score: number };

// game over pe score submit + top 10 (score nahi diya toh sirf board)
export default function Board({ game, score = 0 }: { game: string; score?: number }) {
  const g = byId(game)!;
  const [scope, setScope] = useState<"today" | "all">("all");
  const [daily, setDaily] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const d = g.daily && getMode() === "daily";
    setDaily(d);
    setScope(d ? "today" : "all");
    try { setName(localStorage.getItem("name") ?? ""); } catch {}
  }, [g]);

  useEffect(() => {
    setRows(null);
    fetch(`/api/scores?game=${game}&scope=${scope}`).then((r) => r.json()).then(setRows).catch(() => setRows([]));
  }, [game, scope, sent]);

  const submit = async () => {
    const r = await fetch("/api/scores", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ game, score, name, daily }),
    });
    if (!r.ok) return setErr("Submit nahi hua (naam daal ya net check kar)");
    try { localStorage.setItem("name", name); } catch {}
    setErr(""); setSent(true);
  };
  const share = () => {
    const text = `${g.icon} ${g.name}: ${score} pts${daily ? " (daily)" : ""} — GEOGLITCH`;
    if (navigator.share) navigator.share({ text, url: location.origin }).catch(() => {});
    else navigator.clipboard?.writeText(`${text} ${location.origin}`);
  };

  return (
    <div className="board">
      {g.daily && (
        <div className="tabs">
          {(["today", "all"] as const).map((s) => (
            <button key={s} className={scope === s ? "" : "ghost"} onClick={() => setScope(s)}>
              {s === "today" ? "📅 Aaj" : "🏆 All-time"}
            </button>
          ))}
        </div>
      )}
      <ol className="rows">
        {rows?.map((r, i) => <li key={i}><span>{i + 1}. {r.name}</span><b>{r.score}</b></li>)}
        {rows && !rows.length && <li className="dim">Abhi koi score nahi — pehle tu ban!</li>}
        {!rows && <li className="dim">loading…</li>}
      </ol>
      {score > 0 && !sent && (
        <>
          <input placeholder="Tera naam" maxLength={16} value={name} onChange={(e) => setName(e.target.value)} />
          <button disabled={!name.trim()} onClick={submit}>Leaderboard pe daal ({score})</button>
          {err && <p className="msg">{err}</p>}
        </>
      )}
      {score > 0 && <button className="ghost" onClick={share}>📤 Share</button>}
    </div>
  );
}
