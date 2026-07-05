"use client";

import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { useBaby } from "@/lib/baby-context";
import { useLogs } from "@/lib/hooks/useLogs";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { LogRow } from "@/components/ui/LogRow";
import { BarTrendChart, type TrendPoint } from "@/components/charts/TrendChart";

export default function MedicinePage() {
  const { baby } = useBaby();
  const { medicineLogs, loading, refresh } = useLogs(baby?.id, 90);

  const trend: TrendPoint[] = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    return days.map((day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = medicineLogs.filter((m) => new Date(m.occurred_at) >= dayStart && new Date(m.occurred_at) < dayEnd).length;
      return { label: format(day, "EEE"), value: count };
    });
  }, [medicineLogs]);

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("medicine_logs").delete().eq("id", id);
    refresh();
  }

  if (!baby) return null;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="text-xl font-semibold">Medicine</h1>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground/70">Doses per day, last 7 days</p>
        <GlassCard className="p-3">
          <BarTrendChart data={trend} color="#2dd4bf" />
        </GlassCard>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground/70">Recent logs</p>
        {loading && <p className="text-sm text-foreground/50">Loading…</p>}
        <div className="flex flex-col gap-2">
          {medicineLogs.map((log) => (
            <LogRow
              key={log.id}
              title={`${log.medicine_name} · ${format(new Date(log.occurred_at), "MMM d, h:mm a")}`}
              subtitle={log.notes ?? undefined}
              meta={log.dose_amount ? `${log.dose_amount}${log.dose_unit ?? ""}` : undefined}
              onDelete={() => handleDelete(log.id)}
            />
          ))}
          {!loading && medicineLogs.length === 0 && (
            <p className="text-sm text-foreground/50">No medicine logs yet — tap the + button to add one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
