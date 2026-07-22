"use client";

import { useMemo, useState } from "react";
import { addDays, addWeeks, format, isToday, startOfWeek } from "date-fns";
import { ChefHat, ChevronLeft, ChevronRight, Plus, UtensilsCrossed } from "lucide-react";
import { useBaby } from "@/lib/baby-context";
import { useMealPlan } from "@/lib/hooks/useMealPlan";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { MEAL_SLOTS, itemsForDate, itemsForWeek, mealSlotLabel } from "@/lib/mealPlan";
import type { MealPlanItem } from "@/lib/types";
import { MealPlanSheet } from "@/components/food-timetable/MealPlanSheet";
import { NotificationToggle } from "@/components/food-timetable/NotificationToggle";

type View = "day" | "week";

function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl py-2 text-sm transition-colors",
        active ? "bg-gradient-to-br from-bt-purple to-bt-pink text-white" : "glass text-foreground/70"
      )}
    >
      {children}
    </button>
  );
}

export default function FoodTimetablePage() {
  const { baby } = useBaby();
  const { mealPlanItems, foodCatalog, loading, addMealPlanItem, updateMealPlanItem, deleteMealPlanItem } = useMealPlan(baby?.id);

  const [view, setView] = useState<View>("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MealPlanItem | null>(null);
  const [sheetDefaultDate, setSheetDefaultDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [sheetDefaultSlot, setSheetDefaultSlot] = useState<MealPlanItem["meal_slot"]>("lunch");

  const prepTonightItems = useMemo(
    () => itemsForDate(mealPlanItems, addDays(new Date(), 1)).filter((i) => i.prep_previous_day),
    [mealPlanItems]
  );

  const dayItems = useMemo(() => itemsForDate(mealPlanItems, selectedDate), [mealPlanItems, selectedDate]);
  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const weekMap = useMemo(() => itemsForWeek(mealPlanItems, weekStart), [mealPlanItems, weekStart]);

  function openAdd(date: Date, slot: MealPlanItem["meal_slot"] = "lunch") {
    setEditingItem(null);
    setSheetDefaultDate(format(date, "yyyy-MM-dd"));
    setSheetDefaultSlot(slot);
    setSheetOpen(true);
  }

  function openEdit(item: MealPlanItem) {
    setEditingItem(item);
    setSheetDefaultDate(item.start_date);
    setSheetDefaultSlot(item.meal_slot);
    setSheetOpen(true);
  }

  if (!baby) return null;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <ChefHat size={22} /> Food Timetable
        </h1>
        <Button onClick={() => openAdd(view === "day" ? selectedDate : new Date())} className="flex items-center gap-1.5 px-3 py-2">
          <Plus size={16} /> Add
        </Button>
      </div>

      <NotificationToggle />

      {prepTonightItems.length > 0 && (
        <GlassCard strong className="flex items-start gap-3 p-4">
          <UtensilsCrossed size={20} className="mt-0.5 shrink-0 text-bt-amber" />
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground/50">Prep tonight for tomorrow</p>
            <p className="text-sm">{prepTonightItems.map((i) => i.food_name).join(", ")}</p>
          </div>
        </GlassCard>
      )}

      <div className="flex gap-2">
        <SegButton active={view === "day"} onClick={() => setView("day")}>Day</SegButton>
        <SegButton active={view === "week"} onClick={() => setView("week")}>Week</SegButton>
      </div>

      {loading && <p className="text-sm text-foreground/50">Loading…</p>}

      {view === "day" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="glass rounded-full p-2 text-foreground/70"
              aria-label="Previous day"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-medium">
              {isToday(selectedDate) ? "Today · " : ""}
              {format(selectedDate, "EEEE, MMM d")}
            </p>
            <button
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="glass rounded-full p-2 text-foreground/70"
              aria-label="Next day"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {MEAL_SLOTS.map((slot) => {
            const items = dayItems.filter((i) => i.meal_slot === slot.id);
            return (
              <div key={slot.id}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground/70">{slot.label}</p>
                  <button
                    onClick={() => openAdd(selectedDate, slot.id)}
                    className="rounded-full p-1 text-foreground/50 hover:bg-white/10"
                    aria-label={`Add ${slot.label}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {items.length === 0 && <p className="text-xs text-foreground/40">Nothing planned</p>}
                  {items.map((item) => (
                    <MealItemRow key={item.id} item={item} onClick={() => openEdit(item)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "week" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedDate((d) => addWeeks(d, -1))}
              className="glass rounded-full p-2 text-foreground/70"
              aria-label="Previous week"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-medium">
              {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
            </p>
            <button
              onClick={() => setSelectedDate((d) => addWeeks(d, 1))}
              className="glass rounded-full p-2 text-foreground/70"
              aria-label="Next week"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {Array.from(weekMap.entries()).map(([dateStr, items]) => {
            const date = new Date(dateStr);
            return (
              <GlassCard
                key={dateStr}
                className="flex flex-col gap-2 p-3.5"
                onClick={() => {
                  setSelectedDate(date);
                  setView("day");
                }}
              >
                <p className="text-sm font-medium">
                  {isToday(date) ? "Today · " : ""}
                  {format(date, "EEE, MMM d")}
                </p>
                {items.length === 0 ? (
                  <p className="text-xs text-foreground/40">Nothing planned</p>
                ) : (
                  <p className="text-xs text-foreground/60">
                    {items.map((i) => `${mealSlotLabel(i.meal_slot)}: ${i.food_name}`).join(" · ")}
                  </p>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      <MealPlanSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        babyId={baby.id}
        foodCatalog={foodCatalog}
        editingItem={editingItem}
        defaultDate={sheetDefaultDate}
        defaultSlot={sheetDefaultSlot}
        addMealPlanItem={addMealPlanItem}
        updateMealPlanItem={updateMealPlanItem}
        deleteMealPlanItem={deleteMealPlanItem}
      />
    </div>
  );
}

function MealItemRow({ item, onClick }: { item: MealPlanItem; onClick: () => void }) {
  return (
    <GlassCard className="flex items-center justify-between gap-3 p-3" onClick={onClick}>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.food_name}</p>
        {item.notes && <p className="truncate text-xs text-foreground/60">{item.notes}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.repeat_type !== "none" && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-foreground/60">repeats</span>
        )}
        {item.prep_previous_day && (
          <span className="rounded-full bg-bt-amber/20 px-2 py-0.5 text-[10px] text-bt-amber">prep ahead</span>
        )}
      </div>
    </GlassCard>
  );
}
