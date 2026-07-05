"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Moon, Milk, Baby as BabyIcon, Salad, Toilet, Pill } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useBaby } from "@/lib/baby-context";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { FeedSide, FeedType, DiaperType, SleepType, Texture, Reaction, PottyType } from "@/lib/types";

type Tab = "sleep" | "feed" | "diaper" | "solid" | "potty" | "medicine";

const TABS: { id: Tab; label: string; icon: typeof Moon }[] = [
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "feed", label: "Feed", icon: Milk },
  { id: "diaper", label: "Diaper", icon: BabyIcon },
  { id: "solid", label: "Solid", icon: Salad },
  { id: "potty", label: "Potty", icon: Toilet },
  { id: "medicine", label: "Medicine", icon: Pill },
];

function nowLocalInput() {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function QuickAddSheet({ open, onClose, onLogged }: { open: boolean; onClose: () => void; onLogged: () => void }) {
  const { baby } = useBaby();
  const [tab, setTab] = useState<Tab>("sleep");
  const [saving, setSaving] = useState(false);

  if (!baby) return null;

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
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl glass-sheet p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quick add</h2>
              <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10">
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl py-2.5 text-xs transition-colors",
                    tab === t.id ? "bg-gradient-to-br from-bt-purple to-bt-pink text-white" : "glass text-foreground/70"
                  )}
                >
                  <t.icon size={18} />
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "sleep" && (
              <SleepForm babyId={baby.id} saving={saving} setSaving={setSaving} onDone={() => { onLogged(); onClose(); }} />
            )}
            {tab === "feed" && (
              <FeedForm babyId={baby.id} saving={saving} setSaving={setSaving} onDone={() => { onLogged(); onClose(); }} />
            )}
            {tab === "diaper" && (
              <DiaperForm babyId={baby.id} saving={saving} setSaving={setSaving} onDone={() => { onLogged(); onClose(); }} />
            )}
            {tab === "solid" && (
              <SolidForm babyId={baby.id} saving={saving} setSaving={setSaving} onDone={() => { onLogged(); onClose(); }} />
            )}
            {tab === "potty" && (
              <PottyForm babyId={baby.id} saving={saving} setSaving={setSaving} onDone={() => { onLogged(); onClose(); }} />
            )}
            {tab === "medicine" && (
              <MedicineForm babyId={baby.id} saving={saving} setSaving={setSaving} onDone={() => { onLogged(); onClose(); }} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-foreground/70">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-bt-purple/60";

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

function SleepForm({ babyId, saving, setSaving, onDone }: { babyId: string; saving: boolean; setSaving: (b: boolean) => void; onDone: () => void }) {
  const [type, setType] = useState<SleepType>("nap");
  const [start, setStart] = useState(nowLocalInput());
  const [end, setEnd] = useState("");
  const [wakings, setWakings] = useState(0);
  const [notes, setNotes] = useState("");

  async function submit() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("sleep_logs").insert({
      baby_id: babyId,
      type,
      start_time: new Date(start).toISOString(),
      end_time: end ? new Date(end).toISOString() : null,
      night_wakings: type === "night" ? wakings : 0,
      notes: notes || null,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <SegButton active={type === "nap"} onClick={() => setType("nap")}>Nap</SegButton>
        <SegButton active={type === "night"} onClick={() => setType("night")}>Night sleep</SegButton>
      </div>
      <Field label="Start time">
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
      </Field>
      <Field label="End time (leave blank if ongoing)">
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
      </Field>
      {type === "night" && (
        <Field label="Night wakings">
          <input type="number" min={0} value={wakings} onChange={(e) => setWakings(Number(e.target.value))} className={inputClass} />
        </Field>
      )}
      <Field label="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Optional" />
      </Field>
      <Button onClick={submit} disabled={saving} className="mt-2 w-full">
        {saving ? "Saving…" : "Save sleep log"}
      </Button>
    </div>
  );
}

function FeedForm({ babyId, saving, setSaving, onDone }: { babyId: string; saving: boolean; setSaving: (b: boolean) => void; onDone: () => void }) {
  const [type, setType] = useState<FeedType>("breast");
  const [side, setSide] = useState<FeedSide>("left");
  const [duration, setDuration] = useState(10);
  const [amountMl, setAmountMl] = useState(90);
  const [occurredAt, setOccurredAt] = useState(nowLocalInput());
  const [notes, setNotes] = useState("");

  async function submit() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("feed_logs").insert({
      baby_id: babyId,
      type,
      side: type === "breast" ? side : null,
      duration_min: type !== "bottle" ? duration : null,
      amount_ml: type !== "breast" ? amountMl : null,
      occurred_at: new Date(occurredAt).toISOString(),
      notes: notes || null,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <SegButton active={type === "breast"} onClick={() => setType("breast")}>Breast</SegButton>
        <SegButton active={type === "bottle"} onClick={() => setType("bottle")}>Bottle</SegButton>
        <SegButton active={type === "pump"} onClick={() => setType("pump")}>Pump</SegButton>
      </div>

      {type === "breast" && (
        <>
          <div className="flex gap-2">
            <SegButton active={side === "left"} onClick={() => setSide("left")}>Left</SegButton>
            <SegButton active={side === "right"} onClick={() => setSide("right")}>Right</SegButton>
            <SegButton active={side === "both"} onClick={() => setSide("both")}>Both</SegButton>
          </div>
          <Field label="Duration (min)">
            <input type="number" min={0} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass} />
          </Field>
        </>
      )}

      {(type === "bottle" || type === "pump") && (
        <Field label="Amount (ml)">
          <input type="number" min={0} value={amountMl} onChange={(e) => setAmountMl(Number(e.target.value))} className={inputClass} />
        </Field>
      )}

      <Field label="Time">
        <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Optional" />
      </Field>
      <Button onClick={submit} disabled={saving} className="mt-2 w-full">
        {saving ? "Saving…" : "Save feed log"}
      </Button>
    </div>
  );
}

function DiaperForm({ babyId, saving, setSaving, onDone }: { babyId: string; saving: boolean; setSaving: (b: boolean) => void; onDone: () => void }) {
  const [type, setType] = useState<DiaperType>("wet");
  const [color, setColor] = useState("");
  const [texture, setTexture] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowLocalInput());
  const [notes, setNotes] = useState("");

  async function submit() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("diaper_logs").insert({
      baby_id: babyId,
      type,
      color: color || null,
      texture: texture || null,
      occurred_at: new Date(occurredAt).toISOString(),
      notes: notes || null,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <SegButton active={type === "wet"} onClick={() => setType("wet")}>Wet</SegButton>
        <SegButton active={type === "poop"} onClick={() => setType("poop")}>Poop</SegButton>
        <SegButton active={type === "both"} onClick={() => setType("both")}>Both</SegButton>
      </div>
      {(type === "poop" || type === "both") && (
        <>
          <Field label="Color">
            <input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} placeholder="e.g. yellow, brown, green" />
          </Field>
          <Field label="Texture">
            <input value={texture} onChange={(e) => setTexture(e.target.value)} className={inputClass} placeholder="e.g. soft, hard/pellet, watery" />
          </Field>
        </>
      )}
      <Field label="Time">
        <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Optional" />
      </Field>
      <Button onClick={submit} disabled={saving} className="mt-2 w-full">
        {saving ? "Saving…" : "Save diaper log"}
      </Button>
    </div>
  );
}

const TEXTURES: Texture[] = ["puree", "mashed", "finger_food", "blw"];
const REACTIONS: Reaction[] = ["none", "rash", "vomiting", "gas", "constipation", "diarrhea"];

function SolidForm({ babyId, saving, setSaving, onDone }: { babyId: string; saving: boolean; setSaving: (b: boolean) => void; onDone: () => void }) {
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [texture, setTexture] = useState<Texture>("puree");
  const [reaction, setReaction] = useState<Reaction>("none");
  const [dateIntroduced, setDateIntroduced] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  async function submit() {
    if (!foodName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("solid_logs").insert({
      baby_id: babyId,
      food_name: foodName.trim(),
      quantity: quantity || null,
      texture,
      reaction,
      date_introduced: dateIntroduced,
      notes: notes || null,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Food name">
        <input value={foodName} onChange={(e) => setFoodName(e.target.value)} className={inputClass} placeholder="e.g. Ragi porridge" />
      </Field>
      <Field label="Quantity">
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} placeholder="e.g. 2 tbsp" />
      </Field>
      <Field label="Texture">
        <select value={texture} onChange={(e) => setTexture(e.target.value as Texture)} className={inputClass}>
          {TEXTURES.map((t) => (
            <option key={t} value={t}>{t.replace("_", " ")}</option>
          ))}
        </select>
      </Field>
      <Field label="Reaction">
        <select value={reaction} onChange={(e) => setReaction(e.target.value as Reaction)} className={inputClass}>
          {REACTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </Field>
      <Field label="Date introduced">
        <input type="date" value={dateIntroduced} onChange={(e) => setDateIntroduced(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Notes / allergy watch">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Optional" />
      </Field>
      <Button onClick={submit} disabled={saving} className="mt-2 w-full">
        {saving ? "Saving…" : "Save solid food log"}
      </Button>
    </div>
  );
}

function PottyForm({ babyId, saving, setSaving, onDone }: { babyId: string; saving: boolean; setSaving: (b: boolean) => void; onDone: () => void }) {
  const [type, setType] = useState<PottyType>("pee");
  const [occurredAt, setOccurredAt] = useState(nowLocalInput());
  const [notes, setNotes] = useState("");

  async function submit() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("potty_logs").insert({
      baby_id: babyId,
      type,
      occurred_at: new Date(occurredAt).toISOString(),
      notes: notes || null,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <SegButton active={type === "pee"} onClick={() => setType("pee")}>Pee</SegButton>
        <SegButton active={type === "poop"} onClick={() => setType("poop")}>Poop</SegButton>
        <SegButton active={type === "both"} onClick={() => setType("both")}>Both</SegButton>
      </div>
      <Field label="Time">
        <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Optional" />
      </Field>
      <Button onClick={submit} disabled={saving} className="mt-2 w-full">
        {saving ? "Saving…" : "Save potty log"}
      </Button>
    </div>
  );
}

function MedicineForm({ babyId, saving, setSaving, onDone }: { babyId: string; saving: boolean; setSaving: (b: boolean) => void; onDone: () => void }) {
  const [medicineName, setMedicineName] = useState("");
  const [doseAmount, setDoseAmount] = useState("");
  const [doseUnit, setDoseUnit] = useState("ml");
  const [occurredAt, setOccurredAt] = useState(nowLocalInput());
  const [notes, setNotes] = useState("");

  async function submit() {
    if (!medicineName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("medicine_logs").insert({
      baby_id: babyId,
      medicine_name: medicineName.trim(),
      dose_amount: doseAmount ? Number(doseAmount) : null,
      dose_unit: doseUnit || null,
      occurred_at: new Date(occurredAt).toISOString(),
      notes: notes || null,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Medicine name">
        <input value={medicineName} onChange={(e) => setMedicineName(e.target.value)} className={inputClass} placeholder="e.g. Gas Drops" />
      </Field>
      <div className="flex gap-2">
        <div className="flex-1">
          <Field label="Dose amount">
            <input type="number" min={0} step="0.1" value={doseAmount} onChange={(e) => setDoseAmount(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Unit">
            <select value={doseUnit} onChange={(e) => setDoseUnit(e.target.value)} className={inputClass}>
              <option value="ml">ml</option>
              <option value="mg">mg</option>
              <option value="drops">drops</option>
              <option value="tsp">tsp</option>
            </select>
          </Field>
        </div>
      </div>
      <Field label="Time">
        <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Optional" />
      </Field>
      <Button onClick={submit} disabled={saving} className="mt-2 w-full">
        {saving ? "Saving…" : "Save medicine log"}
      </Button>
    </div>
  );
}
