import Link from "next/link";
import { GAMES } from "@/lib/games";
import Bests from "./bests";
import ModeToggle from "./mode";

export default function Home() {
  return (
    <main className="shell">
      <h1 className="logo">GEO<span>GLITCH</span></h1>
      <p className="dim">Geography, but cursed.</p>
      <ModeToggle />
      {GAMES.map((g) => (
        <Link key={g.id} href={"/" + g.id} className="card game">
          <span className="ico">{g.icon}</span>
          <span>
            <b>{g.name}</b>
            <small>{g.tag}{g.daily ? "" : " · (daily nahi)"}</small>
          </span>
          <Bests id={g.id} />
        </Link>
      ))}
      <Link href="/board" className="card center">🏆 Leaderboards</Link>
    </main>
  );
}
