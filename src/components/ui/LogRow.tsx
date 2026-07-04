"use client";

import { Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export function LogRow({
  title,
  subtitle,
  meta,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  onDelete: () => void;
}) {
  return (
    <GlassCard className="flex items-center justify-between gap-3 p-3.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle && <p className="truncate text-xs text-foreground/60">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {meta && <span className="text-xs text-foreground/50">{meta}</span>}
        <button onClick={onDelete} className="rounded-full p-1.5 text-foreground/40 hover:bg-white/10 hover:text-bt-red" aria-label="Delete">
          <Trash2 size={15} />
        </button>
      </div>
    </GlassCard>
  );
}
