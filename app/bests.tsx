"use client";
import { useBest } from "@/lib/ui";

export default function Bests({ id }: { id: string }) {
  const [b] = useBest(id);
  return <em>{b ? `🏆 ${b}` : ""}</em>;
}
