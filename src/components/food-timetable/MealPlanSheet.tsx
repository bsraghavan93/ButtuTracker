"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { MEAL_SLOTS, REPEAT_TYPES, WEEKDAY_LABELS, combinedFoodOptions } from "@/lib/mealPlan";
import type { MealPlanItemInput } from "@/lib/hooks/useMealPlan";
import type { FoodCatalogItem, FoodCategory, MealPlanItem, MealSlot, RepeatType } from "@/lib/types";

const inputClass = "glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-bt-purple/60";

const CATEGORIES: FoodCategory[] = ["grain", "legume", "vegetable", "fruit", "protein", "dairy", "other"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-foreground/70">{label}</span>
      {children}
    </label>
  );
}

function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl py-2 text-xs transition-colors",
        active ? "bg-gradient-to-br from-bt-purple to-bt-pink text-white" : "glass text-foreground/70"
      )}
    >
      {children}
    </button>
  );
}

export function MealPlanSheet({
  open,
  onClose,
  babyId,
  foodCatalog,
  editingItem,
  defaultDate,
  defaultSlot = "lunch",
  addMealPlanItem,
  updateMealPlanItem,
  deleteMealPlanItem,
}: {
  open: boolean;
  onClose: () => void;
  babyId: string;
  foodCatalog: FoodCatalogItem[];
  editingItem: MealPlanItem | null;
  defaultDate: string;
  defaultSlot?: MealSlot;
  addMealPlanItem: (babyId: string, input: MealPlanItemInput) => Promise<void>;
  updateMealPlanItem: (id: string, input: MealPlanItemInput) => Promise<void>;
  deleteMealPlanItem: (id: string) => Promise<void>;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Keyed so the form's local state re-initializes from props each
              time a different item (or a fresh "add") is opened, instead of
              syncing state from props via an effect. */}
          <MealPlanForm
            key={editingItem?.id ?? `new-${defaultDate}-${defaultSlot}`}
            onClose={onClose}
            babyId={babyId}
            foodCatalog={foodCatalog}
            editingItem={editingItem}
            defaultDate={defaultDate}
            defaultSlot={defaultSlot}
            addMealPlanItem={addMealPlanItem}
            updateMealPlanItem={updateMealPlanItem}
            deleteMealPlanItem={deleteMealPlanItem}
          />
        </>
      )}
    </AnimatePresence>
  );
}

function MealPlanForm({
  onClose,
  babyId,
  foodCatalog,
  editingItem,
  defaultDate,
  defaultSlot,
  addMealPlanItem,
  updateMealPlanItem,
  deleteMealPlanItem,
}: {
  onClose: () => void;
  babyId: string;
  foodCatalog: FoodCatalogItem[];
  editingItem: MealPlanItem | null;
  defaultDate: string;
  defaultSlot: MealSlot;
  addMealPlanItem: (babyId: string, input: MealPlanItemInput) => Promise<void>;
  updateMealPlanItem: (id: string, input: MealPlanItemInput) => Promise<void>;
  deleteMealPlanItem: (id: string) => Promise<void>;
}) {
  const foodOptions = combinedFoodOptions(foodCatalog);

  const [foodName, setFoodName] = useState(editingItem?.food_name ?? "");
  const [category, setCategory] = useState<FoodCategory>(editingItem?.category ?? "other");
  const [mealSlot, setMealSlot] = useState<MealSlot>(editingItem?.meal_slot ?? defaultSlot);
  const [startDate, setStartDate] = useState(editingItem?.start_date ?? defaultDate);
  const [endDate, setEndDate] = useState(editingItem?.end_date ?? "");
  const [repeatType, setRepeatType] = useState<RepeatType>(editingItem?.repeat_type ?? "none");
  const [repeatDays, setRepeatDays] = useState<number[]>(editingItem?.repeat_days ?? []);
  const [prepPreviousDay, setPrepPreviousDay] = useState(editingItem?.prep_previous_day ?? false);
  const [notes, setNotes] = useState(editingItem?.notes ?? "");
  const [saving, setSaving] = useState(false);

  function handleFoodNameChange(value: string) {
    setFoodName(value);
    const match = foodOptions.find((f) => f.name.toLowerCase() === value.trim().toLowerCase());
    if (match) setCategory(match.category);
  }

  function toggleRepeatDay(day: number) {
    setRepeatDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  async function submit() {
    if (!foodName.trim()) return;
    setSaving(true);
    const input: MealPlanItemInput = {
      food_name: foodName.trim(),
      category,
      meal_slot: mealSlot,
      start_date: startDate,
      end_date: repeatType === "none" ? null : endDate || null,
      repeat_type: repeatType,
      repeat_days: repeatType === "weekly" ? repeatDays : [],
      prep_previous_day: prepPreviousDay,
      notes: notes || null,
    };
    if (editingItem) {
      await updateMealPlanItem(editingItem.id, input);
    } else {
      await addMealPlanItem(babyId, input);
    }
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!editingItem) return;
    setSaving(true);
    await deleteMealPlanItem(editingItem.id);
    setSaving(false);
    onClose();
  }

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl glass-sheet p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
    >
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{editingItem ? "Edit timetable item" : "Add to food timetable"}</h2>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10">
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <Field label="Food">
          <input
            value={foodName}
            onChange={(e) => handleFoodNameChange(e.target.value)}
            className={inputClass}
            placeholder="e.g. Ragi porridge"
            list="food-options"
          />
          <datalist id="food-options">
            {foodOptions.map((f) => (
              <option key={f.name} value={f.name} />
            ))}
          </datalist>
        </Field>

        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as FoodCategory)} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Meal">
          <select value={mealSlot} onChange={(e) => setMealSlot(e.target.value as MealSlot)} className={inputClass}>
            {MEAL_SLOTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Date">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </Field>

        <Field label="Repeat">
          <select value={repeatType} onChange={(e) => setRepeatType(e.target.value as RepeatType)} className={inputClass}>
            {REPEAT_TYPES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </Field>

        {repeatType === "weekly" && (
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((label, day) => (
              <SegButton key={day} active={repeatDays.includes(day)} onClick={() => toggleRepeatDay(day)}>
                {label}
              </SegButton>
            ))}
          </div>
        )}

        {repeatType !== "none" && (
          <Field label="Repeat until (optional)">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
          </Field>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={prepPreviousDay}
            onChange={(e) => setPrepPreviousDay(e.target.checked)}
            className="h-4 w-4 rounded accent-bt-purple"
          />
          <span className="text-foreground/80">Needs prep the previous day</span>
        </label>

        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Optional" />
        </Field>

        <div className="mt-2 flex gap-2">
          {editingItem && (
            <Button variant="danger" onClick={handleDelete} disabled={saving} className="flex items-center justify-center gap-1.5 px-3">
              <Trash2 size={16} />
            </Button>
          )}
          <Button onClick={submit} disabled={saving} className="flex-1">
            {saving ? "Saving…" : editingItem ? "Save changes" : "Add to timetable"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
