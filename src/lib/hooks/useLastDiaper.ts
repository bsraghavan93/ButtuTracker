"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DiaperLog } from "@/lib/types";

export function useLastDiaper(babyId: string | undefined) {
  const [lastDiaper, setLastDiaper] = useState<DiaperLog | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!babyId) {
      setLastDiaper(null);
      setLoaded(true);
      return;
    }
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("diaper_logs")
        .select("*")
        .eq("baby_id", babyId)
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastDiaper((data as DiaperLog) ?? null);
    } finally {
      setLoaded(true);
    }
  }, [babyId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch-on-mount; setState happens post-await
    refresh();
  }, [refresh]);

  return { lastDiaper, loaded, refresh };
}

export type LastDiaperHook = ReturnType<typeof useLastDiaper>;
