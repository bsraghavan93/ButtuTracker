import { addDays, differenceInCalendarDays, format, isAfter, isBefore, parseISO, startOfDay } from "date-fns";
import { FOOD_BANK } from "@/lib/foods";
import type { FoodCatalogItem, MealPlanItem, MealSlot, RepeatType } from "@/lib/types";

export const MEAL_SLOTS: { id: MealSlot; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "morning_snack", label: "Morning snack" },
  { id: "lunch", label: "Lunch" },
  { id: "afternoon_snack", label: "Afternoon snack" },
  { id: "dinner", label: "Dinner" },
];

export const REPEAT_TYPES: { id: RepeatType; label: string }[] = [
  { id: "none", label: "Doesn't repeat" },
  { id: "daily", label: "Every day" },
  { id: "every_other_day", label: "Every other day" },
  { id: "weekly", label: "Specific days each week" },
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function mealSlotLabel(slot: MealSlot): string {
  return MEAL_SLOTS.find((s) => s.id === slot)?.label ?? slot;
}

/** Does this recurring/one-off meal plan item land on the given date? */
export function occursOnDate(item: MealPlanItem, date: Date): boolean {
  const day = startOfDay(date);
  const start = startOfDay(parseISO(item.start_date));
  if (isBefore(day, start)) return false;
  if (item.end_date && isAfter(day, startOfDay(parseISO(item.end_date)))) return false;

  switch (item.repeat_type) {
    case "none":
      return differenceInCalendarDays(day, start) === 0;
    case "daily":
      return true;
    case "every_other_day":
      return differenceInCalendarDays(day, start) % 2 === 0;
    case "weekly":
      return item.repeat_days.includes(day.getDay());
    default:
      return false;
  }
}

/** Group the items that occur on `date`, ordered by meal slot. */
export function itemsForDate(items: MealPlanItem[], date: Date): MealPlanItem[] {
  const slotOrder = MEAL_SLOTS.map((s) => s.id);
  return items
    .filter((item) => occursOnDate(item, date))
    .sort((a, b) => slotOrder.indexOf(a.meal_slot) - slotOrder.indexOf(b.meal_slot));
}

/** Map of yyyy-MM-dd -> items occurring that day, for a 7-day window starting at `weekStart`. */
export function itemsForWeek(items: MealPlanItem[], weekStart: Date): Map<string, MealPlanItem[]> {
  const map = new Map<string, MealPlanItem[]>();
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    map.set(format(day, "yyyy-MM-dd"), itemsForDate(items, day));
  }
  return map;
}

export type FoodOption = { name: string; category: FoodCatalogItem["category"] };

/** Combined, de-duplicated food picker list: static FOOD_BANK + user-added catalog items. */
export function combinedFoodOptions(catalog: FoodCatalogItem[]): FoodOption[] {
  const seen = new Set<string>();
  const options: FoodOption[] = [];
  for (const f of FOOD_BANK) {
    const key = f.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ name: f.name, category: f.category });
  }
  for (const c of catalog) {
    const key = c.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ name: c.name, category: c.category });
  }
  return options.sort((a, b) => a.name.localeCompare(b.name));
}
