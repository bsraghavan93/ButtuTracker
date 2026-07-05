"use client";

import { useEffect, useState } from "react";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Live-ticking "hh:mm:ss" elapsed-since clock, used for the sleep card's
// running wake-window / nap-in-progress badge.
export function useElapsedClock(sinceIso: string | null | undefined) {
  const [elapsed, setElapsed] = useState(() => (sinceIso ? formatElapsed(Date.now() - new Date(sinceIso).getTime()) : ""));

  useEffect(() => {
    if (!sinceIso) return;
    const since = new Date(sinceIso).getTime();
    const interval = setInterval(() => setElapsed(formatElapsed(Date.now() - since)), 1000);
    return () => clearInterval(interval);
  }, [sinceIso]);

  return elapsed;
}
