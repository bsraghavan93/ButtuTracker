import { differenceInCalendarDays, differenceInCalendarWeeks, differenceInCalendarMonths } from "date-fns";

export function ageInDays(dob: string, at: Date = new Date()): number {
  return differenceInCalendarDays(at, new Date(dob));
}

export function ageInWeeks(dob: string, at: Date = new Date()): number {
  return differenceInCalendarWeeks(at, new Date(dob));
}

export function ageInMonths(dob: string, at: Date = new Date()): number {
  return differenceInCalendarMonths(at, new Date(dob));
}

export function formatAge(dob: string, at: Date = new Date()): string {
  const days = ageInDays(dob, at);
  const months = ageInMonths(dob, at);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} old`;
  if (months < 1) return `${ageInWeeks(dob, at)} weeks old`;
  const weeks = ageInWeeks(dob, at) - months * 4;
  return weeks > 0 ? `${months} mo, ${weeks} wk` : `${months} month${months === 1 ? "" : "s"} old`;
}

/** Typical awake-window ceiling (minutes) before overtiredness sets in, by age. */
export function maxWakeWindowMinutes(ageMonths: number): number {
  if (ageMonths < 1) return 60;
  if (ageMonths < 2) return 75;
  if (ageMonths < 3) return 90;
  if (ageMonths < 4) return 105;
  if (ageMonths < 6) return 135;
  if (ageMonths < 9) return 165;
  if (ageMonths < 12) return 195;
  if (ageMonths < 18) return 240;
  return 300;
}

/** Expected number of naps by age, used for routine suggestions. */
export function expectedNaps(ageMonths: number): number {
  if (ageMonths < 4) return 4;
  if (ageMonths < 6) return 3;
  if (ageMonths < 9) return 3;
  if (ageMonths < 15) return 2;
  return 1;
}

/** Target total day sleep (minutes) by age, for "daytime sleep is low" checks. */
export function targetDaySleepMinutes(ageMonths: number): number {
  if (ageMonths < 4) return 300; // ~5h
  if (ageMonths < 6) return 210; // ~3.5h
  if (ageMonths < 9) return 180; // ~3h
  if (ageMonths < 15) return 150; // ~2.5h
  return 120; // ~2h
}

/** Target total night sleep (minutes) by age. */
export function targetNightSleepMinutes(ageMonths: number): number {
  if (ageMonths < 4) return 540; // ~9h
  return 660; // ~11h
}
