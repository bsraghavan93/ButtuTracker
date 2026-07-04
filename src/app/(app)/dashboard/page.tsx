"use client";

import { useMemo, useState } from "react";
import { format, subDays, differenceInMinutes } from "date-fns";
import { Moon, Milk, Salad, Baby as BabyIcon, AlarmClock, Sparkles, FileDown, FileSpreadsheet } from "lucide-react";
import { useBaby } from "@/lib/baby-context";
import { useLogs } from "@/lib/hooks/useLogs";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { RecentActivitySheet, type ActivityPanel } from "@/components/ui/RecentActivitySheet";
import { AreaTrendChart, BarTrendChart, type TrendPoint } from "@/components/charts/TrendChart";
import { formatMinutes, sleepMinutes } from "@/lib/utils";
import { exportSummaryToExcel, exportSummaryToPdf } from "@/lib/export";

export default function DashboardPage() {
  const { baby, loading: babyLoading } = useBaby();
  const { sleepLogs, feedLogs, solidLogs, diaperLogs, growthLogs, loading } = useLogs(baby?.id, 14);
  const [activePanel, setActivePanel] = useState<ActivityPanel | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todaysSleep = sleepLogs.filter((s) => new Date(s.start_time) >= today);
  const todaysFeeds = feedLogs.filter((f) => new Date(f.occurred_at) >= today);
  const todaysSolids = solidLogs.filter((s) => new Date(s.date_introduced) >= today);
  const todaysDiapers = diaperLogs.filter((d) => new Date(d.occurred_at) >= today);

  const totalSleepMin = todaysSleep.reduce((sum, s) => sum + sleepMinutes(s.start_time, s.end_time), 0);
  const napCount = todaysSleep.filter((s) => s.type === "nap").length;

  const longestWakeWindow = useMemo(() => {
    const sorted = [...sleepLogs]
      .filter((s) => s.end_time)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    let longest = 0;
    for (let i = 1; i < sorted.length; i++) {
      const gap = differenceInMinutes(new Date(sorted[i].start_time), new Date(sorted[i - 1].end_time!));
      if (gap > longest) longest = gap;
    }
    return longest;
  }, [sleepLogs]);

  const symptomCount = solidLogs.filter((s) => s.reaction && s.reaction !== "none").length;

  const sleepTrend: TrendPoint[] = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    return days.map((day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const mins = sleepLogs
        .filter((s) => new Date(s.start_time) >= dayStart && new Date(s.start_time) < dayEnd)
        .reduce((sum, s) => sum + sleepMinutes(s.start_time, s.end_time), 0);
      return { label: format(day, "EEE"), value: Math.round(mins / 60 * 10) / 10 };
    });
  }, [sleepLogs]);

  const feedTrend: TrendPoint[] = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    return days.map((day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = feedLogs.filter((f) => new Date(f.occurred_at) >= dayStart && new Date(f.occurred_at) < dayEnd).length;
      return { label: format(day, "EEE"), value: count };
    });
  }, [feedLogs]);

  if (babyLoading || !baby) {
    return <div className="pt-10 text-center text-foreground/60">Loading Buttu&apos;s data…</div>;
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Moon}
          label="Total sleep today"
          value={formatMinutes(totalSleepMin)}
          sub={`${napCount} nap${napCount === 1 ? "" : "s"}`}
          accent="bt-purple"
          onClick={() => setActivePanel("sleep")}
        />
        <StatCard
          icon={AlarmClock}
          label="Longest wake window"
          value={longestWakeWindow ? formatMinutes(longestWakeWindow) : "—"}
          accent="bt-blue"
          onClick={() => setActivePanel("sleep")}
        />
        <StatCard icon={Milk} label="Milk feeds today" value={String(todaysFeeds.length)} accent="bt-pink" onClick={() => setActivePanel("feed")} />
        <StatCard icon={Salad} label="Solids today" value={String(todaysSolids.length)} accent="bt-teal" onClick={() => setActivePanel("solid")} />
        <StatCard icon={BabyIcon} label="Diapers today" value={String(todaysDiapers.length)} accent="bt-amber" onClick={() => setActivePanel("diaper")} />
        <StatCard
          icon={Sparkles}
          label="Symptoms flagged"
          value={String(symptomCount)}
          sub="from solids reactions"
          accent="bt-red"
          onClick={() => setActivePanel("solid")}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground/70">Sleep trend (7 days, hours)</p>
        <GlassCard className="p-3">
          <AreaTrendChart data={sleepTrend} color="#a78bfa" valueSuffix="h" />
        </GlassCard>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground/70">Milk feeds trend (7 days, count)</p>
        <GlassCard className="p-3">
          <BarTrendChart data={feedTrend} color="#60a5fa" />
        </GlassCard>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground/70">Export for pediatrician</p>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex flex-1 items-center justify-center gap-2"
            disabled={loading}
            onClick={() =>
              exportSummaryToPdf({
                baby,
                rangeLabel: `${format(subDays(new Date(), 14), "MM/dd/yyyy")} - ${format(new Date(), "MM/dd/yyyy")}`,
                sleepLogs,
                feedLogs,
                solidLogs,
                diaperLogs,
                growthLogs,
              })
            }
          >
            <FileDown size={16} /> PDF
          </Button>
          <Button
            variant="ghost"
            className="flex flex-1 items-center justify-center gap-2"
            disabled={loading}
            onClick={() =>
              exportSummaryToExcel({
                baby,
                rangeLabel: `${format(subDays(new Date(), 14), "MM/dd/yyyy")} - ${format(new Date(), "MM/dd/yyyy")}`,
                sleepLogs,
                feedLogs,
                solidLogs,
                diaperLogs,
                growthLogs,
              })
            }
          >
            <FileSpreadsheet size={16} /> Excel
          </Button>
        </div>
      </div>

      <p className="pb-2 text-center text-[11px] text-foreground/40">
        Buttu Tracker offers supportive guidance only — not a medical diagnosis. For red-flag symptoms, please contact your pediatrician.
      </p>

      <RecentActivitySheet
        panel={activePanel}
        onClose={() => setActivePanel(null)}
        sleepLogs={sleepLogs}
        feedLogs={feedLogs}
        solidLogs={solidLogs}
        diaperLogs={diaperLogs}
      />
    </div>
  );
}
