"use client";

import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

type Accent = "bt-purple" | "bt-pink" | "bt-blue" | "bt-teal" | "bt-amber" | "bt-red";

const ACCENT_CLASSES: Record<Accent, { bg: string; text: string }> = {
  "bt-purple": { bg: "bg-bt-purple/20", text: "text-bt-purple" },
  "bt-pink": { bg: "bg-bt-pink/20", text: "text-bt-pink" },
  "bt-blue": { bg: "bg-bt-blue/20", text: "text-bt-blue" },
  "bt-teal": { bg: "bg-bt-teal/20", text: "text-bt-teal" },
  "bt-amber": { bg: "bg-bt-amber/20", text: "text-bt-amber" },
  "bt-red": { bg: "bg-bt-red/20", text: "text-bt-red" },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "bt-purple",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: Accent;
  onClick?: () => void;
}) {
  const classes = ACCENT_CLASSES[accent];
  return (
    <GlassCard
      className={cn("flex flex-col gap-2 p-4 text-left", onClick && "cursor-pointer")}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.97 } : undefined}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${classes.bg}`}>
        <Icon size={18} className={classes.text} />
      </div>
      <p className="text-xl font-semibold leading-tight">{value}</p>
      <p className="text-xs text-foreground/60">{label}</p>
      {sub && <p className="text-[11px] text-foreground/40">{sub}</p>}
    </GlassCard>
  );
}
