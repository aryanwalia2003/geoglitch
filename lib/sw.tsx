"use client";
import { useEffect } from "react";

// sirf production mein register (dev mein HMR toot-ta hai)
export default function Sw() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") navigator.serviceWorker?.register("/sw.js");
  }, []);
  return null;
}
