import { differenceInMinutes } from "date-fns";
import { ageInMonths, maxWakeWindowMinutes, expectedNaps, targetDaySleepMinutes, targetNightSleepMinutes } from "@/lib/age";
import { suggestNextFoods } from "@/lib/foods";
import type { SleepLog, FeedLog, SolidLog, DiaperLog } from "@/lib/types";

export type GuidanceLevel = "info" | "tip" | "warning" | "urgent";

export type GuidanceItem = {
  level: GuidanceLevel;
  category: "sleep" | "feeding" | "solids" | "diaper" | "growth" | "safety";
  title: string;
  message: string;
};

const RED_FLAG_KEYWORDS: { keyword: string; label: string }[] = [
  { keyword: "blood", label: "blood in stool" },
  { keyword: "breath", label: "breathing difficulty" },
  { keyword: "wheez", label: "breathing difficulty" },
  { keyword: "fever", label: "fever" },
  { keyword: "lethargic", label: "lethargy" },
  { keyword: "unresponsive", label: "unresponsiveness" },
  { keyword: "swelling", label: "swelling / possible severe allergic reaction" },
  { keyword: "hives", label: "hives / possible allergic reaction" },
  { keyword: "dehydrat", label: "dehydration" },
  { keyword: "not feeding", label: "poor feeding" },
  { keyword: "refus", label: "poor feeding" },
];

function scanForRedFlags(notes: (string | null | undefined)[]): GuidanceItem[] {
  const items: GuidanceItem[] = [];
  const found = new Set<string>();
  for (const note of notes) {
    if (!note) continue;
    const lower = note.toLowerCase();
    for (const { keyword, label } of RED_FLAG_KEYWORDS) {
      if (lower.includes(keyword) && !found.has(label)) {
        found.add(label);
        items.push({
          level: "urgent",
          category: "safety",
          title: `Possible ${label}`,
          message: `A note mentions signs of ${label}. This app cannot diagnose — please contact your pediatrician or seek urgent care if this is severe or persistent.`,
        });
      }
    }
  }
  return items;
}

function minutesBetween(a: string, b: string | null) {
  if (!b) return 0;
  return Math.max(0, differenceInMinutes(new Date(b), new Date(a)));
}

export function sleepGuidance(dob: string, sleepLogs: SleepLog[]): GuidanceItem[] {
  const items: GuidanceItem[] = [];
  const ageMonths = ageInMonths(dob);
  const maxWake = maxWakeWindowMinutes(ageMonths);

  const sorted = [...sleepLogs].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );
  const lastSleep = sorted.find((s) => s.end_time);

  if (lastSleep?.end_time) {
    const wokeAt = new Date(lastSleep.end_time);
    const awakeMinutes = differenceInMinutes(new Date(), wokeAt);
    if (awakeMinutes >= maxWake) {
      items.push({
        level: "warning",
        category: "sleep",
        title: "Wake window exceeded",
        message: `Buttu has been awake ${awakeMinutes} min, past the typical ${maxWake} min ceiling for this age. Watch for overtired signs (fussiness, eye-rubbing, staring off) and start winding down for a nap or bedtime soon.`,
      });
    } else if (awakeMinutes >= maxWake - 20) {
      const nextBy = new Date(wokeAt.getTime() + maxWake * 60000);
      items.push({
        level: "tip",
        category: "sleep",
        title: "Nap coming up",
        message: `Aim to start the next nap/bedtime by ~${nextBy.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} to stay ahead of overtiredness.`,
      });
    }
  }

  // Short nap detection (last completed nap under 30 min)
  const lastNap = sorted.find((s) => s.type === "nap" && s.end_time);
  if (lastNap) {
    const dur = minutesBetween(lastNap.start_time, lastNap.end_time);
    if (dur > 0 && dur < 30) {
      items.push({
        level: "tip",
        category: "sleep",
        title: "Short nap",
        message: `That nap was only ${dur} min — a classic "short nap." Consider an earlier next wake window and an easier bedtime tonight to make up the deficit.`,
      });
    }
  }

  // Daytime totals for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysLogs = sleepLogs.filter((s) => new Date(s.start_time) >= today);
  const dayNaps = todaysLogs.filter((s) => s.type === "nap");
  const daySleepMin = dayNaps.reduce((sum, s) => sum + minutesBetween(s.start_time, s.end_time), 0);
  const nightLogs = todaysLogs.filter((s) => s.type === "night");
  const nightSleepMin = nightLogs.reduce((sum, s) => sum + minutesBetween(s.start_time, s.end_time), 0);

  const targetDay = targetDaySleepMinutes(ageMonths);
  if (daySleepMin > 0 && daySleepMin < targetDay * 0.7) {
    items.push({
      level: "tip",
      category: "sleep",
      title: "Daytime sleep is on the low side",
      message: `Only ${Math.round(daySleepMin)} of a ~${targetDay} min daytime sleep target so far. Consider an earlier bedtime tonight to offset the sleep debt.`,
    });
  }

  const expected = expectedNaps(ageMonths);
  if (dayNaps.length > 0 && dayNaps.length < expected) {
    items.push({
      level: "info",
      category: "sleep",
      title: "Nap count",
      message: `${dayNaps.length} of ~${expected} typical naps for this age so far today.`,
    });
  }

  const targetNight = targetNightSleepMinutes(ageMonths);
  if (nightSleepMin > 0) {
    items.push({
      level: "info",
      category: "sleep",
      title: "Night sleep so far",
      message: `${Math.round(nightSleepMin)} min logged overnight (target ~${targetNight} min).`,
    });
  }

  return items;
}

export function feedingGuidance(feedLogs: FeedLog[], ageMonths: number): GuidanceItem[] {
  const items: GuidanceItem[] = [];
  const sorted = [...feedLogs].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  );
  const last = sorted[0];
  if (last) {
    const gapMin = differenceInMinutes(new Date(), new Date(last.occurred_at));
    const expectedGap = ageMonths < 1 ? 180 : ageMonths < 6 ? 210 : 240;
    if (gapMin >= expectedGap) {
      items.push({
        level: "tip",
        category: "feeding",
        title: "Feeding gap reminder",
        message: `It has been ${Math.round(gapMin / 60)}h ${gapMin % 60}m since the last feed — typical gap at this age is ~${Math.round(expectedGap / 60)}h. Consider offering a feed soon.`,
      });
    }
  }

  if (ageMonths < 12) {
    items.push({
      level: "info",
      category: "feeding",
      title: "Cow's milk reminder",
      message: "Breast milk or formula should remain the main drink until 12 months — cow's milk as a main drink isn't recommended before then.",
    });
  }

  return items;
}

export function solidsGuidance(
  ageMonths: number,
  solidLogs: SolidLog[],
  restrictions: string[]
): GuidanceItem[] {
  const items: GuidanceItem[] = [];

  if (ageMonths < 6) {
    items.push({
      level: "info",
      category: "solids",
      title: "Solids not started yet",
      message: "Most babies are ready to start solids around 6 months. Talk to your pediatrician about the right time for Buttu.",
    });
    return items;
  }

  items.push({
    level: "info",
    category: "solids",
    title: "Age-safe solids reminders",
    message: "No honey before 12 months, avoid choking hazards (whole nuts, whole grapes, hard raw veg/fruit), no added salt or sugar, and keep cow's milk as a side ingredient (not the main drink) before 12 months.",
  });

  const reactive = solidLogs.filter((s) => s.reaction && s.reaction !== "none");
  for (const r of reactive) {
    const severe = r.reaction === "vomiting" || r.reaction === "diarrhea";
    items.push({
      level: severe ? "warning" : "tip",
      category: "solids",
      title: `Watch: ${r.food_name}`,
      message: `Logged reaction "${r.reaction}" after trying ${r.food_name}. Hold off reintroducing until it clears, and keep it in the 3-day watch window before adding new foods.`,
    });
  }

  const recentIntros = solidLogs.filter((s) => {
    const days = (Date.now() - new Date(s.date_introduced).getTime()) / 86400000;
    return days <= 3;
  });
  if (recentIntros.length > 1) {
    items.push({
      level: "warning",
      category: "solids",
      title: "Multiple foods in the 3-day watch window",
      message: `${recentIntros.length} new foods introduced in the last 3 days. For clean allergy tracking, try to space new introductions by 3 days each.`,
    });
  }

  const triedNames = solidLogs.map((s) => s.food_name);
  const suggestions = suggestNextFoods(triedNames, ageMonths, restrictions, 5);
  if (suggestions.length) {
    items.push({
      level: "tip",
      category: "solids",
      title: "Next foods to try",
      message: suggestions.map((f) => f.name).join(", "),
    });
  }

  return items;
}

export function diaperGuidance(diaperLogs: DiaperLog[]): GuidanceItem[] {
  const items: GuidanceItem[] = [];
  const sorted = [...diaperLogs].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  );

  const lastPoop = sorted.find((d) => d.type === "poop" || d.type === "both");
  const hoursSincePoop = lastPoop
    ? differenceInMinutes(new Date(), new Date(lastPoop.occurred_at)) / 60
    : null;

  const hardTextures = ["hard", "pellet", "pellets", "small hard balls"];
  const recentHard = sorted
    .slice(0, 5)
    .some((d) => d.texture && hardTextures.some((h) => d.texture!.toLowerCase().includes(h)));

  if (recentHard) {
    items.push({
      level: "warning",
      category: "diaper",
      title: "Possible constipation pattern",
      message: "Recent poop diapers were logged as hard/pellet-like. Consider offering extra water/fiber-rich purees (if on solids) and mention this at the next pediatrician visit if it continues, especially with visible discomfort.",
    });
  }

  if (hoursSincePoop !== null && hoursSincePoop >= 48) {
    items.push({
      level: "tip",
      category: "diaper",
      title: "No poop in 48h+",
      message: `${Math.round(hoursSincePoop)}h since the last poop diaper. This alone isn't unusual for breastfed babies, but if paired with discomfort, straining, or a hard belly, check in with your pediatrician.`,
    });
  }

  return items;
}

export function computeAllGuidance(params: {
  dob: string;
  restrictions: string[];
  sleepLogs: SleepLog[];
  feedLogs: FeedLog[];
  solidLogs: SolidLog[];
  diaperLogs: DiaperLog[];
}): GuidanceItem[] {
  const ageMonths = ageInMonths(params.dob);
  const allNotes = [
    ...params.sleepLogs.map((s) => s.notes),
    ...params.feedLogs.map((f) => f.notes),
    ...params.solidLogs.map((s) => s.notes),
    ...params.diaperLogs.map((d) => d.notes),
  ];

  const severeReactions = params.solidLogs.filter(
    (s) => s.reaction === "vomiting" || s.reaction === "diarrhea"
  );
  const redFlags = scanForRedFlags(allNotes);
  if (severeReactions.length >= 2) {
    redFlags.push({
      level: "urgent",
      category: "safety",
      title: "Repeated vomiting/diarrhea after solids",
      message: "Multiple recent severe reactions to solids were logged. Please contact your pediatrician — this app cannot diagnose allergies or illness.",
    });
  }

  const items = [
    ...redFlags,
    ...sleepGuidance(params.dob, params.sleepLogs),
    ...feedingGuidance(params.feedLogs, ageMonths),
    ...solidsGuidance(ageMonths, params.solidLogs, params.restrictions),
    ...diaperGuidance(params.diaperLogs),
  ];

  const order: Record<GuidanceLevel, number> = { urgent: 0, warning: 1, tip: 2, info: 3 };
  return items.sort((a, b) => order[a.level] - order[b.level]);
}

/** A single, friendly "AI-style" daily headline suggestion for the dashboard. */
export function dailyHeadline(items: GuidanceItem[], babyName: string): string {
  const urgent = items.find((i) => i.level === "urgent");
  if (urgent) return `⚠️ ${urgent.title}: ${urgent.message}`;
  const warning = items.find((i) => i.level === "warning");
  if (warning) return `${warning.title} — ${warning.message}`;
  const tip = items.find((i) => i.level === "tip");
  if (tip) return `${tip.title} — ${tip.message}`;
  return `${babyName} is having a calm, on-track day. Keep up the routine! 🌤️`;
}
