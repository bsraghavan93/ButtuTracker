"use client";

import { AlertTriangle, Info, Lightbulb, ShieldAlert } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { GuidanceItem, GuidanceLevel } from "@/lib/guidance/engine";

const LEVEL_META: Record<GuidanceLevel, { icon: typeof Info; className: string }> = {
  urgent: { icon: ShieldAlert, className: "text-bt-red" },
  warning: { icon: AlertTriangle, className: "text-bt-amber" },
  tip: { icon: Lightbulb, className: "text-bt-teal" },
  info: { icon: Info, className: "text-bt-blue" },
};

export function GuidanceList({ items, emptyLabel }: { items: GuidanceItem[]; emptyLabel?: string }) {
  if (!items.length) {
    return (
      <GlassCard className="p-4 text-sm text-foreground/60">
        {emptyLabel ?? "No guidance right now — all looks on track."}
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, i) => {
        const meta = LEVEL_META[item.level];
        const Icon = meta.icon;
        return (
          <GlassCard key={i} className="flex gap-3 p-3.5">
            <Icon size={18} className={`mt-0.5 shrink-0 ${meta.className}`} />
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-foreground/60">{item.message}</p>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
