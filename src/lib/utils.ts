import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function agoLabel(iso: string | null | undefined): string {
  if (!iso) return "No entries yet";
  const totalMins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (totalMins < 1) return "Just now";
  const days = Math.floor(totalMins / 1440);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} ago`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours >= 1) return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
  return `${totalMins}m ago`;
}

export function lbToLbOz(totalLb: number): string {
  const lb = Math.floor(totalLb);
  const oz = Math.round((totalLb - lb) * 16);
  return `${lb}lb ${oz}oz`;
}
