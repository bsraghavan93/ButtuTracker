"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FoodCatalogItem, MealPlanItem } from "@/lib/types";

export type MealPlanItemInput = {
  food_name: string;
  category: MealPlanItem["category"];
  meal_slot: MealPlanItem["meal_slot"];
  start_date: string;
  end_date: string | null;
  repeat_type: MealPlanItem["repeat_type"];
  repeat_days: number[];
  prep_previous_day: boolean;
  notes: string | null;
};

export function useMealPlan(babyId: string | undefined) {
  const [mealPlanItems, setMealPlanItems] = useState<MealPlanItem[]>([]);
  const [foodCatalog, setFoodCatalog] = useState<FoodCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!babyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const [plan, catalog] = await Promise.all([
      supabase.from("meal_plan_items").select("*").eq("baby_id", babyId).order("start_date", { ascending: true }),
      supabase.from("food_catalog_items").select("*").order("name", { ascending: true }),
    ]);
    setMealPlanItems((plan.data as MealPlanItem[]) ?? []);
    setFoodCatalog((catalog.data as FoodCatalogItem[]) ?? []);
    setLoading(false);
  }, [babyId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch-on-mount; setState happens post-await
    refresh();
  }, [refresh]);

  async function addMealPlanItem(babyIdArg: string, input: MealPlanItemInput) {
    const supabase = createClient();

    // Grow the food picker with any name that isn't already a known food.
    const known = new Set([
      ...foodCatalog.map((c) => c.name.toLowerCase()),
    ]);
    const nameLower = input.food_name.trim().toLowerCase();
    if (!known.has(nameLower)) {
      await supabase.from("food_catalog_items").upsert(
        { name: input.food_name.trim(), category: input.category },
        { onConflict: "name", ignoreDuplicates: true }
      );
    }

    await supabase.from("meal_plan_items").insert({ baby_id: babyIdArg, ...input });
    await refresh();
  }

  async function updateMealPlanItem(id: string, input: MealPlanItemInput) {
    const supabase = createClient();
    await supabase.from("meal_plan_items").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
    await refresh();
  }

  async function deleteMealPlanItem(id: string) {
    const supabase = createClient();
    await supabase.from("meal_plan_items").delete().eq("id", id);
    await refresh();
  }

  return { mealPlanItems, foodCatalog, loading, refresh, addMealPlanItem, updateMealPlanItem, deleteMealPlanItem };
}
