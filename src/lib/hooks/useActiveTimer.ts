"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SleepLog, SleepType, FeedLog, FeedSide } from "@/lib/types";

export function useActiveTimer(babyId: string | undefined) {
  const [activeSleep, setActiveSleep] = useState<SleepLog | null>(null);
  const [activeFeed, setActiveFeed] = useState<FeedLog | null>(null);

  const refresh = useCallback(async () => {
    if (!babyId) {
      setActiveSleep(null);
      setActiveFeed(null);
      return;
    }
    const supabase = createClient();
    const [sleep, feed] = await Promise.all([
      supabase
        .from("sleep_logs")
        .select("*")
        .eq("baby_id", babyId)
        .is("end_time", null)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("feed_logs")
        .select("*")
        .eq("baby_id", babyId)
        .in("type", ["breast", "pump"])
        .is("duration_min", null)
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setActiveSleep((sleep.data as SleepLog) ?? null);
    setActiveFeed((feed.data as FeedLog) ?? null);
  }, [babyId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch-on-mount; setState happens post-await
    refresh();
  }, [refresh]);

  const startSleep = useCallback(
    async (type: SleepType) => {
      if (!babyId) return;
      const supabase = createClient();
      await supabase.from("sleep_logs").insert({
        baby_id: babyId,
        type,
        start_time: new Date().toISOString(),
      });
      await refresh();
    },
    [babyId, refresh]
  );

  const stopSleep = useCallback(
    async (opts?: { notes?: string; nightWakings?: number }) => {
      if (!activeSleep) return;
      const supabase = createClient();
      await supabase
        .from("sleep_logs")
        .update({
          end_time: new Date().toISOString(),
          ...(opts?.notes ? { notes: opts.notes } : {}),
          ...(opts?.nightWakings !== undefined ? { night_wakings: opts.nightWakings } : {}),
        })
        .eq("id", activeSleep.id);
      await refresh();
    },
    [activeSleep, refresh]
  );

  const startFeed = useCallback(
    async (type: "breast" | "pump", side?: FeedSide) => {
      if (!babyId) return;
      const supabase = createClient();
      await supabase.from("feed_logs").insert({
        baby_id: babyId,
        type,
        side: side ?? null,
        occurred_at: new Date().toISOString(),
      });
      await refresh();
    },
    [babyId, refresh]
  );

  const stopFeed = useCallback(
    async (opts?: { notes?: string; amountMl?: number }) => {
      if (!activeFeed) return;
      const startedAt = new Date(activeFeed.occurred_at).getTime();
      const durationMin = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      const supabase = createClient();
      await supabase
        .from("feed_logs")
        .update({
          duration_min: durationMin,
          ...(opts?.notes ? { notes: opts.notes } : {}),
          ...(opts?.amountMl !== undefined ? { amount_ml: opts.amountMl } : {}),
        })
        .eq("id", activeFeed.id);
      await refresh();
    },
    [activeFeed, refresh]
  );

  return { activeSleep, activeFeed, refresh, startSleep, stopSleep, startFeed, stopFeed };
}

export type ActiveTimer = ReturnType<typeof useActiveTimer>;
