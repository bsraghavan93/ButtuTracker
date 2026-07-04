"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Food } from "@/lib/types";

export function useFoods(babyId: string | undefined) {
  const [foods, setFoods] = useState<Food[]>([]);

  const refresh = useCallback(async () => {
    if (!babyId) {
      setFoods([]);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("foods")
      .select("*")
      .eq("baby_id", babyId)
      .order("created_at", { ascending: true });
    setFoods((data as Food[]) ?? []);
  }, [babyId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch-on-mount; setState happens post-await
    refresh();
  }, [refresh]);

  const addFood = useCallback(
    async (name: string, emoji: string) => {
      if (!babyId || !name.trim()) return;
      const supabase = createClient();
      await supabase.from("foods").insert({ baby_id: babyId, name: name.trim(), emoji: emoji || "🍽️" });
      await refresh();
    },
    [babyId, refresh]
  );

  return { foods, addFood };
}
