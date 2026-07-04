"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useBaby } from "@/lib/baby-context";
import { useLogs } from "@/lib/hooks/useLogs";
import { createClient } from "@/lib/supabase/client";
import { ageInMonths } from "@/lib/age";
import { suggestNextFoods } from "@/lib/foods";
import { GlassCard } from "@/components/ui/GlassCard";
import { LogRow } from "@/components/ui/LogRow";
import { GuidanceList } from "@/components/ui/GuidanceList";
import { solidsGuidance } from "@/lib/guidance/engine";

export default function SolidsPage() {
  const { baby } = useBaby();
  const { solidLogs, loading, refresh } = useLogs(baby?.id, 60);

  const ageMonths = baby ? ageInMonths(baby.dob) : 0;
  const restrictions = useMemo(() => baby?.food_restrictions ?? [], [baby]);

  const guidance = useMemo(
    () => (baby ? solidsGuidance(ageMonths, solidLogs, restrictions) : []),
    [baby, ageMonths, solidLogs, restrictions]
  );

  const nextFoods = useMemo(() => {
    if (!baby) return [];
    return suggestNextFoods(solidLogs.map((s) => s.food_name), ageMonths, restrictions, 6);
  }, [baby, solidLogs, ageMonths, restrictions]);

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("solid_logs").delete().eq("id", id);
    refresh();
  }

  if (!baby) return null;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="text-xl font-semibold">Solids</h1>

      <GuidanceList items={guidance} />

      {nextFoods.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground/70">Suggested next foods</p>
          <div className="flex flex-wrap gap-2">
            {nextFoods.map((f) => (
              <GlassCard key={f.name} className="px-3 py-2 text-xs">
                <span className="font-medium">{f.name}</span>
                {f.ironRich && <span className="ml-1.5 text-bt-teal">· iron-rich</span>}
                {f.tamilFood && <span className="ml-1.5 text-bt-amber">· Tamil</span>}
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-foreground/70">Foods tried</p>
        {loading && <p className="text-sm text-foreground/50">Loading…</p>}
        <div className="flex flex-col gap-2">
          {solidLogs.map((log) => (
            <LogRow
              key={log.id}
              title={`${log.food_name} · ${format(new Date(log.date_introduced), "MMM d")}`}
              subtitle={[log.texture?.replace("_", " "), log.quantity, log.notes].filter(Boolean).join(" · ") || undefined}
              meta={log.reaction && log.reaction !== "none" ? log.reaction : undefined}
              onDelete={() => handleDelete(log.id)}
            />
          ))}
          {!loading && solidLogs.length === 0 && (
            <p className="text-sm text-foreground/50">No solids logged yet — tap the + button to add one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
