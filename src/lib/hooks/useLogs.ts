"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SleepLog, FeedLog, SolidLog, DiaperLog, GrowthLog, PottyLog, MedicineLog } from "@/lib/types";

export function useLogs(babyId: string | undefined, sinceDays = 14) {
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [feedLogs, setFeedLogs] = useState<FeedLog[]>([]);
  const [solidLogs, setSolidLogs] = useState<SolidLog[]>([]);
  const [diaperLogs, setDiaperLogs] = useState<DiaperLog[]>([]);
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([]);
  const [pottyLogs, setPottyLogs] = useState<PottyLog[]>([]);
  const [medicineLogs, setMedicineLogs] = useState<MedicineLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!babyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const since = new Date();
    since.setDate(since.getDate() - sinceDays);
    const sinceIso = since.toISOString();

    const [sleep, feed, solid, diaper, growth, potty, medicine] = await Promise.all([
      supabase.from("sleep_logs").select("*").eq("baby_id", babyId).gte("start_time", sinceIso).order("start_time", { ascending: false }),
      supabase.from("feed_logs").select("*").eq("baby_id", babyId).gte("occurred_at", sinceIso).order("occurred_at", { ascending: false }),
      supabase.from("solid_logs").select("*").eq("baby_id", babyId).order("date_introduced", { ascending: false }),
      supabase.from("diaper_logs").select("*").eq("baby_id", babyId).gte("occurred_at", sinceIso).order("occurred_at", { ascending: false }),
      supabase.from("growth_logs").select("*").eq("baby_id", babyId).order("measured_at", { ascending: false }),
      supabase.from("potty_logs").select("*").eq("baby_id", babyId).gte("occurred_at", sinceIso).order("occurred_at", { ascending: false }),
      supabase.from("medicine_logs").select("*").eq("baby_id", babyId).gte("occurred_at", sinceIso).order("occurred_at", { ascending: false }),
    ]);

    setSleepLogs((sleep.data as SleepLog[]) ?? []);
    setFeedLogs((feed.data as FeedLog[]) ?? []);
    setSolidLogs((solid.data as SolidLog[]) ?? []);
    setDiaperLogs((diaper.data as DiaperLog[]) ?? []);
    setGrowthLogs((growth.data as GrowthLog[]) ?? []);
    setPottyLogs((potty.data as PottyLog[]) ?? []);
    setMedicineLogs((medicine.data as MedicineLog[]) ?? []);
    setLoading(false);
  }, [babyId, sinceDays]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch-on-mount; setState happens post-await
    refresh();
  }, [refresh]);

  return { sleepLogs, feedLogs, solidLogs, diaperLogs, growthLogs, pottyLogs, medicineLogs, loading, refresh };
}
