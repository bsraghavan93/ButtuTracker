"use client";

import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { useBaby } from "@/lib/baby-context";
import { useLogs } from "@/lib/hooks/useLogs";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { LogRow } from "@/components/ui/LogRow";
import { AreaTrendChart, type TrendPoint } from "@/components/charts/TrendChart";
import { formatMinutes, sleepMinutes } from "@/lib/utils";

export default function SleepPage() {
  const { baby } = useBaby();
  const { sleepLogs, loading, refresh } = useLogs(baby?.id, 14);

  const trend: TrendPoint[] = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    return days.map((day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const mins = sleepLogs
        .filter((s) => new Date(s.start_time) >= dayStart && new Date(s.start_time) < dayEnd)
        .reduce((sum, s) => sum + sleepMinutes(s.start_time, s.end_time), 0);
      return { label: format(day, "EEE"), value: Math.round((mins / 60) * 10) / 10 };
    });
  }, [sleepLogs]);

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("sleep_logs").delete().eq("id", id);
    refresh();
  }

  if (!baby) return null;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="text-xl font-semibold">Sleep</h1>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground/70">Total sleep, last 7 days (hours)</p>
        <GlassCard className="p-3">
          <AreaTrendChart data={trend} color="#a78bfa" valueSuffix="h" />
        </GlassCard>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground/70">Recent logs</p>
        {loading && <p className="text-sm text-foreground/50">Loading…</p>}
        <div className="flex flex-col gap-2">
          {sleepLogs.map((log) => (
            <LogRow
              key={log.id}
              title={`${log.type === "nap" ? "Nap" : "Night sleep"} · ${format(new Date(log.start_time), "MMM d, h:mm a")}`}
              subtitle={log.notes ?? undefined}
              meta={log.end_time ? formatMinutes(sleepMinutes(log.start_time, log.end_time)) : "ongoing"}
              onDelete={() => handleDelete(log.id)}
            />
          ))}
          {!loading && sleepLogs.length === 0 && (
            <p className="text-sm text-foreground/50">No sleep logs yet — tap the + button to add one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
