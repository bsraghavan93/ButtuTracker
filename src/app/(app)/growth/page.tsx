"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useBaby } from "@/lib/baby-context";
import { useLogs } from "@/lib/hooks/useLogs";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { LogRow } from "@/components/ui/LogRow";
import { AreaTrendChart, type TrendPoint } from "@/components/charts/TrendChart";

const inputClass = "glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-bt-purple/60";

export default function GrowthPage() {
  const { baby } = useBaby();
  const { growthLogs, loading, refresh } = useLogs(baby?.id, 365);
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [head, setHead] = useState("");
  const [measuredAt, setMeasuredAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const weightTrend: TrendPoint[] = useMemo(
    () =>
      [...growthLogs]
        .filter((g) => g.weight_lb != null)
        .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
        .map((g) => ({ label: format(new Date(g.measured_at), "MMM d"), value: Number(g.weight_lb) })),
    [growthLogs]
  );

  const lengthTrend: TrendPoint[] = useMemo(
    () =>
      [...growthLogs]
        .filter((g) => g.length_in != null)
        .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
        .map((g) => ({ label: format(new Date(g.measured_at), "MMM d"), value: Number(g.length_in) })),
    [growthLogs]
  );

  async function handleAdd() {
    if (!baby) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("growth_logs").insert({
      baby_id: baby.id,
      weight_lb: weight ? Number(weight) : null,
      length_in: length ? Number(length) : null,
      head_circumference_in: head ? Number(head) : null,
      measured_at: measuredAt,
      notes: notes || null,
    });
    setSaving(false);
    setShowForm(false);
    setWeight("");
    setLength("");
    setHead("");
    setNotes("");
    refresh();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("growth_logs").delete().eq("id", id);
    refresh();
  }

  if (!baby) return null;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Growth</h1>
        <Button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 px-3 py-2">
          <Plus size={16} /> Add
        </Button>
      </div>

      {showForm && (
        <GlassCard strong className="flex flex-col gap-3 p-4">
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-foreground/70">Weight (lb)</span>
              <input type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-foreground/70">Length (in)</span>
              <input type="number" step="0.1" value={length} onChange={(e) => setLength(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-foreground/70">Head (in)</span>
              <input type="number" step="0.1" value={head} onChange={(e) => setHead(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-foreground/70">Date</span>
            <input type="date" value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-foreground/70">Pediatrician notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} />
          </label>
          <Button onClick={handleAdd} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save growth entry"}
          </Button>
        </GlassCard>
      )}

      {weightTrend.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground/70">Weight trend (lb)</p>
          <GlassCard className="p-3">
            <AreaTrendChart data={weightTrend} color="#2dd4bf" valueSuffix=" lb" />
          </GlassCard>
        </div>
      )}

      {lengthTrend.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground/70">Length trend (in)</p>
          <GlassCard className="p-3">
            <AreaTrendChart data={lengthTrend} color="#60a5fa" valueSuffix=" in" />
          </GlassCard>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-foreground/70">Entries</p>
        {loading && <p className="text-sm text-foreground/50">Loading…</p>}
        <div className="flex flex-col gap-2">
          {growthLogs.map((g) => (
            <LogRow
              key={g.id}
              title={format(new Date(g.measured_at), "MMM d, yyyy")}
              subtitle={[g.weight_lb && `${g.weight_lb} lb`, g.length_in && `${g.length_in} in`, g.head_circumference_in && `head ${g.head_circumference_in} in`, g.notes]
                .filter(Boolean)
                .join(" · ")}
              onDelete={() => handleDelete(g.id)}
            />
          ))}
          {!loading && growthLogs.length === 0 && <p className="text-sm text-foreground/50">No growth entries yet.</p>}
        </div>
      </div>
    </div>
  );
}
