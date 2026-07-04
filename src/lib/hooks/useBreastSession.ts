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
};

function storageKey(babyId: string) {
  return `buttu:breast-session:${babyId}`;
}

function load(babyId: string): BreastSessionState | null {
  try {
    const raw = localStorage.getItem(storageKey(babyId));
    return raw ? (JSON.parse(raw) as BreastSessionState) : null;
  } catch {
    return null;
  }
}

export function useBreastSession(babyId: string | undefined) {
  const [session, setSession] = useState<BreastSessionState | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage on mount/babyId change
    setSession(babyId ? load(babyId) : null);
  }, [babyId]);

  const persist = useCallback(
    (next: BreastSessionState | null) => {
      setSession(next);
      if (!babyId) return;
      if (next) localStorage.setItem(storageKey(babyId), JSON.stringify(next));
      else localStorage.removeItem(storageKey(babyId));
    },
    [babyId]
  );

  const toggleSide = useCallback(
    (side: BreastSide) => {
      const current: BreastSessionState =
        session ?? { startedAt: Date.now(), leftMs: 0, rightMs: 0, leftRunningSince: null, rightRunningSince: null };
      const runningKey = side === "left" ? "leftRunningSince" : "rightRunningSince";
      const msKey = side === "left" ? "leftMs" : "rightMs";
      const runningSince = current[runningKey];
      if (runningSince) {
        persist({ ...current, [msKey]: current[msKey] + (Date.now() - runningSince), [runningKey]: null });
      } else {
        persist({ ...current, [runningKey]: Date.now() });
      }
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
      discard();
    },
    [session, babyId, discard, elapsedMs]
  );

  return { session, toggleSide, setSideMinutes, elapsedMs, discard, save, hasSession: !!session };
}

export type BreastSessionHook = ReturnType<typeof useBreastSession>;
