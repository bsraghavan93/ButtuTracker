"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { LogRow } from "@/components/ui/LogRow";
import { formatMinutes, sleepMinutes } from "@/lib/utils";
import type { SleepLog, FeedLog, SolidLog, DiaperLog } from "@/lib/types";

export type ActivityPanel = "sleep" | "feed" | "solid" | "diaper";

const PANEL_META: Record<ActivityPanel, { title: string; href: string }> = {
  sleep: { title: "Recent sleep", href: "/sleep" },
  feed: { title: "Recent feeds", href: "/feeding" },
  solid: { title: "Recent solids", href: "/solids" },
  diaper: { title: "Recent diapers", href: "/diapers" },
};

export function RecentActivitySheet({
  panel,
  onClose,
  sleepLogs,
  feedLogs,
  solidLogs,
  diaperLogs,
}: {
  panel: ActivityPanel | null;
  onClose: () => void;
  sleepLogs: SleepLog[];
  feedLogs: FeedLog[];
  solidLogs: SolidLog[];
  diaperLogs: DiaperLog[];
}) {
  const meta = panel ? PANEL_META[panel] : null;

  return (
    <Sheet open={!!panel} onClose={onClose} title={meta?.title ?? ""}>
      <div className="flex flex-col gap-2">
        {panel === "sleep" &&
          (sleepLogs.length === 0 ? (
            <EmptyState label="No sleep logged yet." />
          ) : (
            sleepLogs
              .slice(0, 5)
              .map((log) => (
                <LogRow
                  key={log.id}
                  title={`${log.type === "nap" ? "Nap" : "Night sleep"} · ${format(new Date(log.start_time), "MMM d, h:mm a")}`}
                  subtitle={log.notes ?? undefined}
                  meta={log.end_time ? formatMinutes(sleepMinutes(log.start_time, log.end_time)) : "ongoing"}
                />
              ))
          ))}

        {panel === "feed" &&
          (feedLogs.length === 0 ? (
            <EmptyState label="No feeds logged yet." />
          ) : (
            feedLogs
              .slice(0, 5)
              .map((log) => (
                <LogRow
                  key={log.id}
                  title={`${log.type[0].toUpperCase()}${log.type.slice(1)}${log.side ? ` · ${log.side}` : ""} · ${format(new Date(log.occurred_at), "MMM d, h:mm a")}`}
                  subtitle={log.notes ?? undefined}
                  meta={log.duration_min ? `${log.duration_min} min` : log.amount_ml ? `${log.amount_ml} ml` : undefined}
                />
              ))
          ))}

        {panel === "solid" &&
          (solidLogs.length === 0 ? (
            <EmptyState label="No solids logged yet." />
          ) : (
            solidLogs
              .slice(0, 5)
              .map((log) => (
                <LogRow
                  key={log.id}
                  title={`${log.food_name} · ${format(new Date(log.date_introduced), "MMM d")}`}
                  subtitle={[log.texture?.replace("_", " "), log.quantity, log.notes].filter(Boolean).join(" · ") || undefined}
                  meta={log.reaction && log.reaction !== "none" ? log.reaction : undefined}
                />
              ))
          ))}

        {panel === "diaper" &&
          (diaperLogs.length === 0 ? (
            <EmptyState label="No diapers logged yet." />
          ) : (
            diaperLogs
              .slice(0, 5)
              .map((log) => (
                <LogRow
                  key={log.id}
                  title={`${log.type[0].toUpperCase()}${log.type.slice(1)} · ${format(new Date(log.occurred_at), "MMM d, h:mm a")}`}
                  subtitle={[log.color, log.texture, log.notes].filter(Boolean).join(" · ") || undefined}
                />
              ))
          ))}

        {meta && (
          <Link href={meta.href} onClick={onClose} className="mt-1 flex items-center justify-center gap-1 py-2 text-sm text-bt-pink">
            View all <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </Sheet>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="py-4 text-center text-sm text-foreground/50">{label}</p>;
}
