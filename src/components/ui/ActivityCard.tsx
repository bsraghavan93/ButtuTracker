"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export type ActivityAccent = "bt-blue" | "bt-amber" | "bt-pink" | "bt-purple" | "bt-teal" | "bt-green";

const ACCENT_CLASSES: Record<ActivityAccent, string> = {
  "bt-blue": "bg-bt-blue",
  "bt-amber": "bg-bt-amber",
  "bt-pink": "bg-bt-pink",
  "bt-purple": "bg-bt-purple",
  "bt-teal": "bg-bt-teal",
  "bt-green": "bg-bt-green",
};

export function ActivityCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  accent,
  href,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge?: string;
  accent: ActivityAccent;
  href: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const bg = ACCENT_CLASSES[accent];

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={() => router.push(href)}
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-3xl p-4 text-left text-slate-900 shadow-lg transition-transform",
        bg,
        compact ? "gap-2" : "gap-3"
      )}
    >
      <div className="pointer-events-none absolute -right-3 -bottom-3 opacity-15">
        <Icon size={compact ? 64 : 88} strokeWidth={1.5} />
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex shrink-0 items-center justify-center rounded-xl bg-black/10", compact ? "h-8 w-8" : "h-10 w-10")}>
          <Icon size={compact ? 16 : 20} />
        </div>
        {badge && (
          <span className="shrink-0 rounded-full bg-black/15 px-2.5 py-1 text-[11px] font-medium">
            {badge}
          </span>
        )}
      </div>
      <div className="relative min-w-0">
        <p className={cn("font-semibold leading-tight", compact ? "text-base" : "text-lg")}>{title}</p>
        <p className="truncate text-xs text-slate-900/70">{subtitle}</p>
      </div>
    </motion.button>
  );
}
