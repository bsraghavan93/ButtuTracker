"use client";

import { useMemo } from "react";
import { format, subDays, addDays, differenceInMinutes } from "date-fns";
import { Moon, Milk, Salad, Baby as BabyIcon, AlarmClock, Sparkles, FileDown, FileSpreadsheet, Droplet, Toilet, Syringe, Pill, TrendingUp, ChefHat, UtensilsCrossed } from "lucide-react";
import { useBaby } from "@/lib/baby-context";
import { useLogs } from "@/lib/hooks/useLogs";
import { useLatestLogs } from "@/lib/hooks/useLatestLogs";
import { useElapsedClock } from "@/lib/hooks/useElapsedClock";
import { useMealPlan } from "@/lib/hooks/useMealPlan";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { GuidanceList } from "@/components/ui/GuidanceList";
import { ActivityCard } from "@/components/ui/ActivityCard";
import { AreaTrendChart, BarTrendChart, type TrendPoint } from "@/components/charts/TrendChart";
import { computeAllGuidance, dailyHeadline } from "@/lib/guidance/engine";
import { itemsForDate } from "@/lib/mealPlan";
import { formatMinutes, agoLabel, lbToLbOz } from "@/lib/utils";
import { exportSummaryToExcel, exportSummaryToPdf } from "@/lib/export";

function sleepMinutes(start: string, end: string | null) {
  if (!end) return 0;
  return Math.max(0, differenceInMinutes(new Date(end), new Date(start)));
}

export default function DashboardPage() {
  const { baby, loading: babyLoading } = useBaby();
  const { sleepLogs, feedLogs, solidLogs, diaperLogs, growthLogs, loading } = useLogs(baby?.id, 14);
  const latest = useLatestLogs(baby?.id);
  const { mealPlanItems } = useMealPlan(baby?.id);

  const prepTonightItems = useMemo(
    () => itemsForDate(mealPlanItems, addDays(new Date(), 1)).filter((i) => i.prep_previous_day),
    [mealPlanItems]
  );

  const sleeping = !!latest.sleep && !latest.sleep.end_time;
  const wakeClockSince = sleeping ? latest.sleep?.start_time : latest.sleep?.end_time;
  const wakeClock = useElapsedClock(wakeClockSince);

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

  const headline = baby ? dailyHeadline(guidance, baby.name) : "";

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
    return <div className="pt-10 text-center text-foreground/60">Loading tracker data…</div>;
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <GlassCard strong className="flex items-start gap-3 p-4">
        <Sparkles size={20} className="mt-0.5 shrink-0 text-bt-amber" />
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground/50">Today&apos;s suggestion</p>
          <p className="text-sm">{headline}</p>
        </div>
      </GlassCard>

      {prepTonightItems.length > 0 && (
        <GlassCard strong className="flex items-start gap-3 p-4">
          <UtensilsCrossed size={20} className="mt-0.5 shrink-0 text-bt-amber" />
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground/50">Prep tonight for tomorrow</p>
            <p className="text-sm">{prepTonightItems.map((i) => i.food_name).join(", ")}</p>
          </div>
        </GlassCard>
      )}

      <div className="flex flex-col gap-3">
        <ActivityCard
          icon={Moon}
          title="Sleep"
          subtitle={
            latest.sleep
              ? `${agoLabel(latest.sleep.start_time)} • ${latest.sleep.end_time ? formatMinutes(sleepMinutes(latest.sleep.start_time, latest.sleep.end_time)) : "ongoing"}`
              : "No entries yet"
          }
          badge={wakeClock || undefined}
          accent="bt-blue"
          href="/sleep"
        />

        <div className="grid grid-cols-2 gap-3">
          <ActivityCard
            icon={Droplet}
            title="Nursing"
            subtitle={
              latest.nursing
                ? `${agoLabel(latest.nursing.occurred_at)} • ${latest.nursing.side ?? ""} ${latest.nursing.duration_min ? `${latest.nursing.duration_min}m` : ""}`.trim()
                : "No entries yet"
            }
            accent="bt-amber"
            href="/feeding"
            compact
          />
          <ActivityCard
            icon={Milk}
            title="Bottle"
            subtitle={latest.bottle ? `${agoLabel(latest.bottle.occurred_at)} • ${latest.bottle.amount_ml ?? "—"}ml` : "No entries yet"}
            accent="bt-pink"
            href="/feeding"
            compact
          />
        </div>

        <ActivityCard
          icon={Salad}
          title="Solids"
          subtitle={latest.solid ? `${agoLabel(latest.solid.date_introduced)} • ${latest.solid.food_name}` : "No entries yet"}
          accent="bt-pink"
          href="/solids"
        />

        <ActivityCard
          icon={ChefHat}
          title="Food Timetable"
          subtitle={
            prepTonightItems.length > 0
              ? `Prep tonight: ${prepTonightItems.map((i) => i.food_name).join(", ")}`
              : "Plan today's and this week's meals"
          }
          accent="bt-amber"
          href="/food-timetable"
        />

        <div className="grid grid-cols-2 gap-3">
          <ActivityCard
            icon={BabyIcon}
            title="Diaper"
            subtitle={latest.diaper ? `${agoLabel(latest.diaper.occurred_at)} • ${latest.diaper.type}` : "No entries yet"}
            accent="bt-amber"
            href="/diapers"
            compact
          />
          <ActivityCard
            icon={Toilet}
            title="Potty"
            subtitle={latest.potty ? `${agoLabel(latest.potty.occurred_at)} • ${latest.potty.type}` : "No entries yet"}
            accent="bt-teal"
            href="/potty"
            compact
          />
        </div>

        <ActivityCard
          icon={Syringe}
          title="Pumping"
          subtitle={latest.pumping ? `${agoLabel(latest.pumping.occurred_at)} • ${latest.pumping.amount_ml ?? "—"}ml` : "No entries yet"}
          accent="bt-purple"
          href="/feeding"
        />

        <ActivityCard
          icon={Pill}
          title="Medicine"
          subtitle={
            latest.medicine
              ? `${agoLabel(latest.medicine.occurred_at)} • ${latest.medicine.dose_amount ?? ""}${latest.medicine.dose_unit ?? ""} ${latest.medicine.medicine_name}`.trim()
              : "No entries yet"
          }
          accent="bt-teal"
          href="/medicine"
        />

        <ActivityCard
          icon={TrendingUp}
          title="Growth"
          subtitle={
            latest.growth
              ? `${agoLabel(latest.growth.measured_at)} • ${[latest.growth.length_in ? `${latest.growth.length_in}in` : null, latest.growth.weight_lb ? lbToLbOz(latest.growth.weight_lb) : null].filter(Boolean).join(" • ")}`
              : "No entries yet"
          }
          accent="bt-green"
          href="/growth"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={AlarmClock} label="Longest wake window" value={longestWakeWindow ? formatMinutes(longestWakeWindow) : "—"} accent="bt-blue" />
        <StatCard icon={Sparkles} label="Symptoms flagged" value={String(symptomCount)} sub="from solids reactions" accent="bt-red" />
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
        <p className="mb-2 text-sm font-medium text-foreground/70">Guidance</p>
        <GuidanceList items={guidance} />
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
    </div>
  );
}
