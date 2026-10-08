import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { byId, today } from "@/lib/games";

// ponytail: bina auth ke — client score bhej sakta hai, bas max se upar nahi. Cheat-proof chahiye toh server-side replay.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  const game = byId(String(b?.game));
  const score = Number(b?.score);
  const name = String(b?.name ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 16);
  const day = b?.daily && game?.daily ? today() : "";
  if (!game || !name || !Number.isInteger(score) || score < 1 || score > game.max)
    return Response.json({ error: "bad input" }, { status: 400 });

  const db = await getDb();
  await db.execute({ sql: "INSERT INTO scores (game, name, score, day) VALUES (?,?,?,?)", args: [game.id, name, score, day] });
  return Response.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const game = byId(req.nextUrl.searchParams.get("game") ?? "");
  if (!game) return Response.json({ error: "bad game" }, { status: 400 });
  const day = req.nextUrl.searchParams.get("scope") === "today" ? today() : null;

  const db = await getDb();
  const r = await db.execute({
    sql: `SELECT name, MAX(score) AS score FROM scores WHERE game = ? ${day ? "AND day = ?" : ""}
          GROUP BY name ORDER BY score DESC LIMIT 10`,
    args: day ? [game.id, day] : [game.id],
  });
  return Response.json(r.rows.map((x) => ({ name: x.name, score: x.score })));
}
