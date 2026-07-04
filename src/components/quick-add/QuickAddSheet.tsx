"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Moon, Milk, Baby as BabyIcon, Salad, Pause, Play, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useBaby } from "@/lib/baby-context";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ActiveTimer } from "@/lib/hooks/useActiveTimer";
import type { BreastSessionHook, BreastSide } from "@/lib/hooks/useBreastSession";
import { useFoods } from "@/lib/hooks/useFoods";
import type { FeedType, DiaperType, FeedLog, Texture, Reaction } from "@/lib/types";

export type Tab = "sleep" | "feed" | "diaper" | "solid";

const TABS: { id: Tab; label: string; icon: typeof Moon }[] = [
  { id: "diaper", label: "Diaper", icon: BabyIcon },
  { id: "feed", label: "Feed", icon: Milk },
  { id: "solid", label: "Solid", icon: Salad },
  { id: "sleep", label: "Sleep", icon: Moon },
];

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function QuickAddSheet({
  open,
  onClose,
  onLogged,
  timer,
  breastSession,
  onQuickLog,
  initialTab,
}: {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
  timer: ActiveTimer;
  breastSession: BreastSessionHook;
  onQuickLog: (opts: { table: string; id: string; label: string }) => void;
  initialTab?: Tab;
}) {
  const { baby } = useBaby();
  const [tab, setTab] = useState<Tab>("diaper");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the active tab when the sheet is opened for a specific action
      setTab(initialTab);
    }
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialTab is read only at the moment the sheet opens
  }, [open]);

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

            <div className="mb-5 grid grid-cols-4 gap-2">
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
              <SleepForm timer={timer} onDone={() => { onLogged(); onClose(); }} />
            )}
            {tab === "feed" && (
              <FeedForm
                babyId={baby.id}
                timer={timer}
                breastSession={breastSession}
                saving={saving}
                setSaving={setSaving}
                onDone={() => { onLogged(); onClose(); }}
              />
            )}
            {tab === "diaper" && (
              <DiaperForm babyId={baby.id} onQuickLog={onQuickLog} onDone={() => { onLogged(); onClose(); }} />
            )}
            {tab === "solid" && (
              <SolidForm babyId={baby.id} saving={saving} setSaving={setSaving} onDone={() => { onLogged(); onClose(); }} />
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

const startButtonClass =
  "flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-bt-purple to-bt-pink py-4 text-base font-semibold text-white disabled:opacity-50";
const altButtonClass = "glass flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold disabled:opacity-50";

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

function SleepForm({ timer, onDone }: { timer: ActiveTimer; onDone: () => void }) {
  const { activeSleep, startSleep, stopSleep } = timer;
  const [wakings, setWakings] = useState(0);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  if (activeSleep) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-foreground/70">
          {activeSleep.type === "nap" ? "Nap" : "Night sleep"} started at {timeLabel(activeSleep.start_time)}
        </p>
        {activeSleep.type === "night" && (
          <Field label="Night wakings">
            <input type="number" min={0} value={wakings} onChange={(e) => setWakings(Number(e.target.value))} className={inputClass} />
          </Field>
        )}
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Optional" />
        </Field>
        <Button
          variant="danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await stopSleep({ notes: notes || undefined, nightWakings: activeSleep.type === "night" ? wakings : undefined });
            setBusy(false);
            onDone();
          }}
          className="mt-2 w-full"
        >
          {busy ? "Stopping…" : "Stop sleep"}
        </Button>
      </div>
    );
  }

  async function start(type: "nap" | "night") {
    setBusy(true);
    await startSleep(type);
    setBusy(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-3">
      <button disabled={busy} onClick={() => start("nap")} className={startButtonClass}>
        <Moon size={20} /> Start nap
      </button>
      <button disabled={busy} onClick={() => start("night")} className={altButtonClass}>
        <Moon size={20} /> Start night sleep
      </button>
    </div>
  );
}

function FeedActiveView({
  feed,
  stopFeed,
  onDone,
  showAmount,
}: {
  feed: FeedLog;
  stopFeed: ActiveTimer["stopFeed"];
  onDone: () => void;
  showAmount?: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [amountMl, setAmountMl] = useState(90);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground/70">
        {feed.type === "breast" ? `Feeding${feed.side ? ` · ${feed.side}` : ""}` : "Pumping"} started at {timeLabel(feed.occurred_at)}
      </p>
      {showAmount && (
        <Field label="Amount (ml)">
          <input type="number" min={0} value={amountMl} onChange={(e) => setAmountMl(Number(e.target.value))} className={inputClass} />
        </Field>
      )}
      <Field label="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Optional" />
      </Field>
      <Button
        variant="danger"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await stopFeed({ notes: notes || undefined, amountMl: showAmount ? amountMl : undefined });
          setBusy(false);
          onDone();
        }}
        className="mt-2 w-full"
      >
        {busy ? "Stopping…" : "Stop"}
      </Button>
    </div>
  );
}

function BreastCircle({
  label,
  ms,
  running,
  onToggle,
}: {
  label: string;
  ms: number;
  running: boolean;
  onToggle: () => void;
}) {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative flex h-28 w-28 flex-col items-center justify-center gap-0.5 rounded-full transition-colors",
        running ? "bg-gradient-to-br from-bt-purple to-bt-pink text-white shadow-lg shadow-purple-900/30" : "glass text-foreground"
      )}
    >
      {running && <span className="absolute inset-0 animate-ping rounded-full bg-white/10" />}
      <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</span>
      <span className="font-mono text-xl tabular-nums">
        {m}:{s.toString().padStart(2, "0")}
      </span>
      {running ? <Pause size={16} /> : <Play size={16} />}
    </button>
  );
}

function durationLabel(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function BreastTimerPanel({ breastSession, onDone }: { breastSession: BreastSessionHook; onDone: () => void }) {
  const { session, lastSide, toggleSide, setSideMinutes, elapsedMs, discard, save } = breastSession;
  const [, setTick] = useState(0);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const leftRunning = !!session?.leftRunningSince;
  const rightRunning = !!session?.rightRunningSince;

  useEffect(() => {
    if (!leftRunning && !rightRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [leftRunning, rightRunning]);

  const leftMs = elapsedMs("left");
  const rightMs = elapsedMs("right");

  function renderSide(side: BreastSide, label: string, ms: number, running: boolean) {
    return (
      <div className="flex flex-col items-center gap-2">
        <BreastCircle label={label} ms={ms} running={running} onToggle={() => toggleSide(side)} />
        {!running && ms > 0 && (
          <div className="flex items-center gap-1 text-xs text-foreground/60">
            <input
              type="number"
              min={0}
              value={Math.round(ms / 60000)}
              onChange={(e) => setSideMinutes(side, Number(e.target.value))}
              className={cn(inputClass, "w-14 text-center")}
            />
            min
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {!session && lastSide && (
        <p className="text-xs text-foreground/50">Last fed: {lastSide === "left" ? "Left" : "Right"} side</p>
      )}
      <p className="text-sm text-foreground/70">Tap a side to start or pause</p>
      <div className="flex gap-6">
        {renderSide("left", "Left", leftMs, leftRunning)}
        {renderSide("right", "Right", rightMs, rightRunning)}
      </div>
      <p className="text-sm text-foreground/70">
        Total <span className="font-mono tabular-nums text-foreground">{durationLabel(leftMs + rightMs)}</span>
      </p>
      <div className="w-full">
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Optional" />
        </Field>
      </div>
      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={() => {
            discard();
            onDone();
          }}
          className="glass flex-1 rounded-2xl py-2.5 text-sm text-foreground/70"
        >
          Discard
        </button>
        <Button
          disabled={busy || (leftMs === 0 && rightMs === 0)}
          onClick={async () => {
            setBusy(true);
            await save({ notes: notes || undefined });
            setBusy(false);
            onDone();
          }}
          className="flex-1"
        >
          {busy ? "Saving…" : "Save feed"}
        </Button>
      </div>
    </div>
  );
}

function FeedForm({
  babyId,
  timer,
  breastSession,
  saving,
  setSaving,
  onDone,
}: {
  babyId: string;
  timer: ActiveTimer;
  breastSession: BreastSessionHook;
  saving: boolean;
  setSaving: (b: boolean) => void;
  onDone: () => void;
}) {
  const [type, setType] = useState<FeedType>("breast");
  const [bottleAmountMl, setBottleAmountMl] = useState(90);
  const [busy, setBusy] = useState(false);
  const { activeFeed, startFeed, stopFeed } = timer;

  async function handleStartPump() {
    setBusy(true);
    await startFeed("pump");
    setBusy(false);
    onDone();
  }

  async function submitBottle() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("feed_logs").insert({
      baby_id: babyId,
      type: "bottle",
      side: null,
      duration_min: null,
      amount_ml: bottleAmountMl,
      occurred_at: new Date().toISOString(),
      notes: null,
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

      {type === "breast" && <BreastTimerPanel breastSession={breastSession} onDone={onDone} />}

      {type === "pump" &&
        (activeFeed?.type === "pump" ? (
          <FeedActiveView feed={activeFeed} stopFeed={stopFeed} onDone={onDone} showAmount />
        ) : (
          <button disabled={busy} onClick={handleStartPump} className={startButtonClass}>
            Start pumping
          </button>
        ))}

      {type === "bottle" && (
        <>
          <Field label="Amount (ml)">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setBottleAmountMl((m) => Math.max(0, m - 10))} className="glass rounded-xl px-3 py-2 text-sm">
                −10
              </button>
              <input
                type="number"
                min={0}
                value={bottleAmountMl}
                onChange={(e) => setBottleAmountMl(Number(e.target.value))}
                className={cn(inputClass, "flex-1 text-center")}
              />
              <button type="button" onClick={() => setBottleAmountMl((m) => m + 10)} className="glass rounded-xl px-3 py-2 text-sm">
                +10
              </button>
            </div>
          </Field>
          <Button onClick={submitBottle} disabled={saving} className="mt-2 w-full">
            {saving ? "Saving…" : "Log bottle"}
          </Button>
        </>
      )}
    </div>
  );
}

const DIAPER_COLORS = ["yellow", "brown", "green", "black"];
const DIAPER_TEXTURES = ["soft", "hard/pellet", "watery", "seedy"];

function ChipRow({
  options,
  value,
  onChange,
  formatLabel,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  formatLabel?: (opt: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? "" : opt)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs capitalize transition-colors",
            value === opt ? "bg-gradient-to-br from-bt-purple to-bt-pink text-white" : "glass text-foreground/70"
          )}
        >
          {formatLabel ? formatLabel(opt) : opt}
        </button>
      ))}
    </div>
  );
}

function formatTextureLabel(t: string) {
  if (t === "blw") return "BLW";
  return t.replace("_", " ");
}

function DiaperForm({
  babyId,
  onQuickLog,
  onDone,
}: {
  babyId: string;
  onQuickLog: (opts: { table: string; id: string; label: string }) => void;
  onDone: () => void;
}) {
  const [detailType, setDetailType] = useState<DiaperType | null>(null);
  const [color, setColor] = useState("");
  const [texture, setTexture] = useState("");
  const [busy, setBusy] = useState(false);

  async function log(type: DiaperType, opts?: { color?: string; texture?: string }) {
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("diaper_logs")
      .insert({
        baby_id: babyId,
        type,
        color: opts?.color || null,
        texture: opts?.texture || null,
        occurred_at: new Date().toISOString(),
        notes: null,
      })
      .select("id")
      .single();
    setBusy(false);
    if (data) {
      onQuickLog({ table: "diaper_logs", id: data.id, label: `${type === "wet" ? "Wet" : type === "poop" ? "Poop" : "Wet + poop"} diaper logged` });
    }
    onDone();
  }

  if (detailType) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <SegButton active={detailType === "poop"} onClick={() => setDetailType("poop")}>Poop</SegButton>
          <SegButton active={detailType === "both"} onClick={() => setDetailType("both")}>Both</SegButton>
        </div>
        <Field label="Color (optional)">
          <ChipRow options={DIAPER_COLORS} value={color} onChange={setColor} />
        </Field>
        <Field label="Texture (optional)">
          <ChipRow options={DIAPER_TEXTURES} value={texture} onChange={setTexture} />
        </Field>
        <Button disabled={busy} onClick={() => log(detailType, { color, texture })} className="mt-2 w-full">
          {busy ? "Saving…" : "Log diaper"}
        </Button>
        <button onClick={() => setDetailType(null)} className="text-center text-xs text-foreground/50">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button disabled={busy} onClick={() => log("wet")} className={startButtonClass}>
        Wet
      </button>
      <button disabled={busy} onClick={() => setDetailType("poop")} className={altButtonClass}>
        Poop
      </button>
      <button disabled={busy} onClick={() => setDetailType("both")} className={altButtonClass}>
        Wet + poop
      </button>
    </div>
  );
}

const TEXTURES: Texture[] = ["puree", "mashed", "finger_food", "blw"];
const REACTIONS: Reaction[] = ["none", "rash", "vomiting", "gas", "constipation", "diarrhea"];

const DEFAULT_FOODS: { name: string; emoji: string }[] = [
  { name: "Ragi porridge", emoji: "🌾" },
  { name: "Moong dal puree", emoji: "🫘" },
  { name: "Masoor dal puree", emoji: "🫘" },
  { name: "Spinach puree", emoji: "🥬" },
  { name: "Iron-fortified rice cereal", emoji: "🍚" },
  { name: "Banana", emoji: "🍌" },
  { name: "Apple puree", emoji: "🍎" },
  { name: "Sweet potato", emoji: "🍠" },
  { name: "Avocado", emoji: "🥑" },
  { name: "Oatmeal", emoji: "🥣" },
  { name: "Yogurt", emoji: "🥛" },
  { name: "Carrot puree", emoji: "🥕" },
];

function FoodTile({ emoji, name, onClick }: { emoji: string; name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition-colors hover:bg-white/10"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="line-clamp-2 text-xs leading-tight text-foreground/80">{name}</span>
    </button>
  );
}

function AddFoodPanel({ onAdd, onBack }: { onAdd: (name: string, emoji: string) => Promise<void>; onBack: () => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🍽️");
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground/70">Add a food to your list</p>
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className={cn(inputClass, "w-16 text-center text-xl")}
          maxLength={4}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(inputClass, "flex-1")}
          placeholder="Food name"
        />
      </div>
      <Button
        disabled={busy || !name.trim()}
        onClick={async () => {
          setBusy(true);
          await onAdd(name, emoji);
          setBusy(false);
          onBack();
        }}
        className="w-full"
      >
        {busy ? "Adding…" : "Add to list"}
      </Button>
      <button onClick={onBack} className="text-center text-xs text-foreground/50">
        Back
      </button>
    </div>
  );
}

function LogFoodPanel({
  babyId,
  food,
  editableName,
  saving,
  setSaving,
  onDone,
  onBack,
}: {
  babyId: string;
  food: { name: string; emoji: string };
  editableName: boolean;
  saving: boolean;
  setSaving: (b: boolean) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [foodName, setFoodName] = useState(food.name);
  const [quantity, setQuantity] = useState("");
  const [texture, setTexture] = useState<Texture>("puree");
  const [reaction, setReaction] = useState<Reaction>("none");
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
      date_introduced: new Date().toISOString().slice(0, 10),
      notes: notes || null,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-3">
      {editableName ? (
        <Field label="Food name">
          <input value={foodName} onChange={(e) => setFoodName(e.target.value)} className={inputClass} placeholder="e.g. Ragi porridge" />
        </Field>
      ) : (
        <p className="flex items-center gap-2 text-base font-semibold">
          <span className="text-2xl">{food.emoji}</span> {food.name}
        </p>
      )}
      <Field label="Quantity">
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} placeholder="e.g. 2 tbsp" autoFocus />
      </Field>
      <Field label="Texture">
        <ChipRow options={TEXTURES} value={texture} onChange={(v) => setTexture(v as Texture)} formatLabel={formatTextureLabel} />
      </Field>
      <Field label="Reaction">
        <ChipRow options={REACTIONS} value={reaction} onChange={(v) => setReaction((v || "none") as Reaction)} />
      </Field>
      <Field label="Notes / allergy watch">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Optional" />
      </Field>
      <Button onClick={submit} disabled={saving} className="mt-2 w-full">
        {saving ? "Saving…" : "Log food"}
      </Button>
      <button onClick={onBack} className="text-center text-xs text-foreground/50">
        Back
      </button>
    </div>
  );
}

function SolidForm({ babyId, saving, setSaving, onDone }: { babyId: string; saving: boolean; setSaving: (b: boolean) => void; onDone: () => void }) {
  const { foods, addFood } = useFoods(babyId);
  const [mode, setMode] = useState<"grid" | "log" | "addFood">("grid");
  const [selected, setSelected] = useState<{ name: string; emoji: string } | null>(null);
  const [editableName, setEditableName] = useState(false);

  const customFoods = foods.filter(
    (f) => !DEFAULT_FOODS.some((d) => d.name.toLowerCase() === f.name.toLowerCase())
  );
  const tiles = [...DEFAULT_FOODS, ...customFoods.map((f) => ({ name: f.name, emoji: f.emoji || "🍽️" }))];

  if (mode === "addFood") {
    return <AddFoodPanel onAdd={addFood} onBack={() => setMode("grid")} />;
  }

  if (mode === "log" && selected) {
    return (
      <LogFoodPanel
        babyId={babyId}
        food={selected}
        editableName={editableName}
        saving={saving}
        setSaving={setSaving}
        onDone={onDone}
        onBack={() => setMode("grid")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground/70">Tap a food to log it</p>
      <div className="grid grid-cols-4 gap-2">
        {tiles.map((f) => (
          <FoodTile
            key={f.name}
            emoji={f.emoji}
            name={f.name}
            onClick={() => {
              setSelected(f);
              setEditableName(false);
              setMode("log");
            }}
          />
        ))}
        <FoodTile
          emoji="✏️"
          name="Other"
          onClick={() => {
            setSelected({ name: "", emoji: "🍽️" });
            setEditableName(true);
            setMode("log");
          }}
        />
        <button
          type="button"
          onClick={() => setMode("addFood")}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-white/25 px-2 py-3 text-center text-foreground/60 transition-colors hover:bg-white/5"
        >
          <Plus size={20} />
          <span className="text-xs">Add food</span>
        </button>
      </div>
    </div>
  );
}
