"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type BreastSide = "left" | "right";

type BreastSessionState = {
  startedAt: number;
  leftMs: number;
  rightMs: number;
  leftRunningSince: number | null;
  rightRunningSince: number | null;
  lastTouchedSide: BreastSide | null;
};

function sessionKey(babyId: string) {
  return `buttu:breast-session:${babyId}`;
}

function lastSideKey(babyId: string) {
  return `buttu:breast-last-side:${babyId}`;
}

function load(babyId: string): BreastSessionState | null {
  try {
    const raw = localStorage.getItem(sessionKey(babyId));
    return raw ? (JSON.parse(raw) as BreastSessionState) : null;
  } catch {
    return null;
  }
}

function loadLastSide(babyId: string): BreastSide | null {
  const raw = localStorage.getItem(lastSideKey(babyId));
  return raw === "left" || raw === "right" ? raw : null;
}

export function useBreastSession(babyId: string | undefined) {
  const [session, setSession] = useState<BreastSessionState | null>(null);
  const [lastSide, setLastSide] = useState<BreastSide | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage on mount/babyId change
    setSession(babyId ? load(babyId) : null);
    setLastSide(babyId ? loadLastSide(babyId) : null);
  }, [babyId]);

  const persist = useCallback(
    (next: BreastSessionState | null) => {
      setSession(next);
      if (!babyId) return;
      if (next) localStorage.setItem(sessionKey(babyId), JSON.stringify(next));
      else localStorage.removeItem(sessionKey(babyId));
    },
    [babyId]
  );

  const toggleSide = useCallback(
    (side: BreastSide) => {
      const other: BreastSide = side === "left" ? "right" : "left";
      const current: BreastSessionState =
        session ?? {
          startedAt: Date.now(),
          leftMs: 0,
          rightMs: 0,
          leftRunningSince: null,
          rightRunningSince: null,
          lastTouchedSide: null,
        };
      const runningKey = side === "left" ? "leftRunningSince" : "rightRunningSince";
      const msKey = side === "left" ? "leftMs" : "rightMs";
      const otherRunningKey = other === "left" ? "leftRunningSince" : "rightRunningSince";
      const otherMsKey = other === "left" ? "leftMs" : "rightMs";
      const runningSince = current[runningKey];

      if (runningSince) {
        persist({ ...current, [msKey]: current[msKey] + (Date.now() - runningSince), [runningKey]: null });
        return;
      }

      const next = { ...current, [runningKey]: Date.now(), lastTouchedSide: side };
      const otherRunningSince = current[otherRunningKey];
      if (otherRunningSince) {
        next[otherMsKey] = current[otherMsKey] + (Date.now() - otherRunningSince);
        next[otherRunningKey] = null;
      }
      persist(next);
    },
    [session, persist]
  );

  const setSideMinutes = useCallback(
    (side: BreastSide, minutes: number) => {
      if (!session) return;
      const msKey = side === "left" ? "leftMs" : "rightMs";
      const runningKey = side === "left" ? "leftRunningSince" : "rightRunningSince";
      persist({ ...session, [msKey]: Math.max(0, minutes) * 60000, [runningKey]: null });
    },
    [session, persist]
  );

  const elapsedMs = useCallback(
    (side: BreastSide): number => {
      if (!session) return 0;
      const runningSince = side === "left" ? session.leftRunningSince : session.rightRunningSince;
      const base = side === "left" ? session.leftMs : session.rightMs;
      return base + (runningSince ? Date.now() - runningSince : 0);
    },
    [session]
  );

  const discard = useCallback(() => persist(null), [persist]);

  const save = useCallback(
    async (opts?: { notes?: string }) => {
      if (!session || !babyId) return;
      const leftMin = Math.round(elapsedMs("left") / 60000);
      const rightMin = Math.round(elapsedMs("right") / 60000);
      const occurredAt = new Date(session.startedAt).toISOString();
      const supabase = createClient();
      const rows: Record<string, unknown>[] = [];
      if (leftMin > 0) {
        rows.push({
          baby_id: babyId,
          type: "breast",
          side: "left",
          duration_min: leftMin,
          amount_ml: null,
          occurred_at: occurredAt,
          notes: opts?.notes || null,
        });
      }
      if (rightMin > 0) {
        rows.push({
          baby_id: babyId,
          type: "breast",
          side: "right",
          duration_min: rightMin,
          amount_ml: null,
          occurred_at: occurredAt,
          notes: opts?.notes || null,
        });
      }
      if (rows.length) await supabase.from("feed_logs").insert(rows);
      if (session.lastTouchedSide) {
        localStorage.setItem(lastSideKey(babyId), session.lastTouchedSide);
        setLastSide(session.lastTouchedSide);
      }
      discard();
    },
    [session, babyId, discard, elapsedMs]
  );

  return { session, lastSide, toggleSide, setSideMinutes, elapsedMs, discard, save, hasSession: !!session };
}

export type BreastSessionHook = ReturnType<typeof useBreastSession>;
