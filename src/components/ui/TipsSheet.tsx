"use client";

import { useMemo } from "react";
import { useBaby } from "@/lib/baby-context";
import { useLogs } from "@/lib/hooks/useLogs";
import { Sheet } from "@/components/ui/Sheet";
import { GuidanceList } from "@/components/ui/GuidanceList";
import { computeAllGuidance } from "@/lib/guidance/engine";

export function TipsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { baby } = useBaby();
  const { sleepLogs, feedLogs, solidLogs, diaperLogs } = useLogs(open ? baby?.id : undefined, 60);

  const guidance = useMemo(() => {
    if (!baby) return [];
    return computeAllGuidance({
      dob: baby.dob,
      restrictions: baby.food_restrictions ?? [],
      sleepLogs,
      feedLogs,
      solidLogs,
      diaperLogs,
    });
  }, [baby, sleepLogs, feedLogs, solidLogs, diaperLogs]);

  return (
    <Sheet open={open} onClose={onClose} title="Tips & guidance">
      <GuidanceList items={guidance} emptyLabel="No tips right now — all looks on track." />
    </Sheet>
  );
}
