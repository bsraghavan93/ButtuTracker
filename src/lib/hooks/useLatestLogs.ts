"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SleepLog, FeedLog, SolidLog, DiaperLog, GrowthLog, PottyLog, MedicineLog } from "@/lib/types";

type LatestLogs = {
  sleep: SleepLog | null;
  nursing: FeedLog | null;
  bottle: FeedLog | null;
  pumping: FeedLog | null;
  solid: SolidLog | null;
  diaper: DiaperLog | null;
  potty: PottyLog | null;
  growth: GrowthLog | null;
  medicine: MedicineLog | null;
};

const EMPTY: LatestLogs = {
  sleep: null,
  nursing: null,
  bottle: null,
  pumping: null,
  solid: null,
  diaper: null,
  potty: null,
  growth: null,
  medicine: null,
};

// Dashboard cards need the single most-recent entry per category regardless
// of the 14-day trend window that useLogs applies elsewhere in the app.
export function useLatestLogs(babyId: string | undefined) {
  const [latest, setLatest] = useState<LatestLogs>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!babyId) {
      setLatest(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();

    const [sleep, nursing, bottle, pumping, solid, diaper, potty, growth, medicine] = await Promise.all([
      supabase.from("sleep_logs").select("*").eq("baby_id", babyId).order("start_time", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("feed_logs").select("*").eq("baby_id", babyId).eq("type", "breast").order("occurred_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("feed_logs").select("*").eq("baby_id", babyId).eq("type", "bottle").order("occurred_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("feed_logs").select("*").eq("baby_id", babyId).eq("type", "pump").order("occurred_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("solid_logs").select("*").eq("baby_id", babyId).order("date_introduced", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("diaper_logs").select("*").eq("baby_id", babyId).order("occurred_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("potty_logs").select("*").eq("baby_id", babyId).order("occurred_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("growth_logs").select("*").eq("baby_id", babyId).order("measured_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("medicine_logs").select("*").eq("baby_id", babyId).order("occurred_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    setLatest({
      sleep: (sleep.data as SleepLog) ?? null,
      nursing: (nursing.data as FeedLog) ?? null,
      bottle: (bottle.data as FeedLog) ?? null,
      pumping: (pumping.data as FeedLog) ?? null,
      solid: (solid.data as SolidLog) ?? null,
      diaper: (diaper.data as DiaperLog) ?? null,
      potty: (potty.data as PottyLog) ?? null,
      growth: (growth.data as GrowthLog) ?? null,
      medicine: (medicine.data as MedicineLog) ?? null,
    });
    setLoading(false);
  }, [babyId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch-on-mount; setState happens post-await
    refresh();
  }, [refresh]);

  return { ...latest, loading, refresh };
}
