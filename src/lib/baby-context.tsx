"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Baby } from "@/lib/types";

type BabyContextValue = {
  baby: Baby | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const BabyContext = createContext<BabyContextValue>({
  baby: null,
  loading: true,
  refresh: async () => {},
});

// This app is for personal/family use only: whoever logs in shares the
// same single baby record and the same data — there's no per-account
// ownership. DEFAULT_BABY is only used the very first time, to create
// that shared record if it doesn't exist yet.
const DEFAULT_BABY = {
  name: "Aryan",
  dob: "2026-01-10",
  family_culture: "Tamil",
  food_restrictions: ["beef", "pork"],
  timezone: "America/New_York",
};

export function BabyProvider({ children }: { children: React.ReactNode }) {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBaby(null);
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from("babies")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existing) {
      setBaby(existing as Baby);
      setLoading(false);
      return;
    }

    const { data: created } = await supabase
      .from("babies")
      .insert({ ...DEFAULT_BABY, user_id: user.id })
      .select("*")
      .single();

    setBaby((created as Baby) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch-on-mount; setState happens post-await
    load();
  }, [load]);

  return (
    <BabyContext.Provider value={{ baby, loading, refresh: load }}>
      {children}
    </BabyContext.Provider>
  );
}

export function useBaby() {
  return useContext(BabyContext);
}
