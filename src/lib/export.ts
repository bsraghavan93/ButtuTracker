import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { formatMinutes } from "@/lib/utils";
import type { Baby, SleepLog, FeedLog, SolidLog, DiaperLog, GrowthLog } from "@/lib/types";

export type SummaryData = {
  baby: Baby;
  rangeLabel: string;
  sleepLogs: SleepLog[];
  feedLogs: FeedLog[];
  solidLogs: SolidLog[];
  diaperLogs: DiaperLog[];
  growthLogs: GrowthLog[];
};

function fmt(dt: string | null) {
  if (!dt) return "—";
  return format(new Date(dt), "MM/dd/yyyy HH:mm");
}

function sleepDurationMin(log: SleepLog) {
  if (!log.end_time) return 0;
  return Math.max(0, (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 60000);
}

export function exportSummaryToExcel(data: SummaryData) {
  const wb = XLSX.utils.book_new();

  const sleepSheet = XLSX.utils.json_to_sheet(
    data.sleepLogs.map((s) => ({
      Type: s.type,
      Start: fmt(s.start_time),
      End: fmt(s.end_time),
      "Duration (min)": Math.round(sleepDurationMin(s)),
      "Night Wakings": s.night_wakings ?? 0,
      Notes: s.notes ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, sleepSheet, "Sleep");

  const feedSheet = XLSX.utils.json_to_sheet(
    data.feedLogs.map((f) => ({
      Type: f.type,
      Side: f.side ?? "",
      "Duration (min)": f.duration_min ?? "",
      "Amount (ml)": f.amount_ml ?? "",
      Time: fmt(f.occurred_at),
      Notes: f.notes ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, feedSheet, "Feeding");

  const solidSheet = XLSX.utils.json_to_sheet(
    data.solidLogs.map((s) => ({
      Food: s.food_name,
      "Date Introduced": s.date_introduced,
      Quantity: s.quantity ?? "",
      Texture: s.texture ?? "",
      Reaction: s.reaction ?? "none",
      "Iron Rich": s.is_iron_rich ? "Yes" : "",
      Notes: s.notes ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, solidSheet, "Solids");

  const diaperSheet = XLSX.utils.json_to_sheet(
    data.diaperLogs.map((d) => ({
      Type: d.type,
      Color: d.color ?? "",
      Texture: d.texture ?? "",
      Time: fmt(d.occurred_at),
      Notes: d.notes ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, diaperSheet, "Diapers");

  const growthSheet = XLSX.utils.json_to_sheet(
    data.growthLogs.map((g) => ({
      Date: g.measured_at,
      "Weight (lb)": g.weight_lb ?? "",
      "Length (in)": g.length_in ?? "",
      "Head Circumference (in)": g.head_circumference_in ?? "",
      Notes: g.notes ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, growthSheet, "Growth");

  XLSX.writeFile(wb, `${data.baby.name}-summary-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
}

export function exportSummaryToPdf(data: SummaryData) {
  const doc = new jsPDF();
  const marginX = 14;
  let y = 18;

  doc.setFontSize(18);
  doc.text(`${data.baby.name}'s Tracker Summary`, marginX, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Range: ${data.rangeLabel}  ·  Generated ${format(new Date(), "MM/dd/yyyy HH:mm")}`, marginX, y);
  y += 4;
  doc.setTextColor(0);

  const addTable = (title: string, head: string[], rows: (string | number)[][]) => {
    if (!rows.length) return;
    y += 8;
    doc.setFontSize(13);
    doc.text(title, marginX, y);
    autoTable(doc, {
      startY: y + 3,
      head: [head],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [167, 139, 250] },
      margin: { left: marginX, right: marginX },
    });
    // @ts-expect-error - lastAutoTable is added by the plugin at runtime
    y = doc.lastAutoTable.finalY;
  };

  addTable(
    "Sleep",
    ["Type", "Start", "End", "Duration", "Wakings", "Notes"],
    data.sleepLogs.map((s) => [
      s.type,
      fmt(s.start_time),
      fmt(s.end_time),
      formatMinutes(sleepDurationMin(s)),
      String(s.night_wakings ?? 0),
      s.notes ?? "",
    ])
  );

  addTable(
    "Feeding",
    ["Type", "Side", "Duration (min)", "Amount (ml)", "Time", "Notes"],
    data.feedLogs.map((f) => [
      f.type,
      f.side ?? "",
      f.duration_min != null ? String(f.duration_min) : "",
      f.amount_ml != null ? String(f.amount_ml) : "",
      fmt(f.occurred_at),
      f.notes ?? "",
    ])
  );

  addTable(
    "Solids",
    ["Food", "Introduced", "Texture", "Reaction", "Notes"],
    data.solidLogs.map((s) => [s.food_name, s.date_introduced, s.texture ?? "", s.reaction ?? "none", s.notes ?? ""])
  );

  addTable(
    "Diapers",
    ["Type", "Color", "Texture", "Time", "Notes"],
    data.diaperLogs.map((d) => [d.type, d.color ?? "", d.texture ?? "", fmt(d.occurred_at), d.notes ?? ""])
  );

  addTable(
    "Growth",
    ["Date", "Weight (lb)", "Length (in)", "Head (in)", "Notes"],
    data.growthLogs.map((g) => [
      g.measured_at,
      g.weight_lb != null ? String(g.weight_lb) : "",
      g.length_in != null ? String(g.length_in) : "",
      g.head_circumference_in != null ? String(g.head_circumference_in) : "",
      g.notes ?? "",
    ])
  );

  doc.save(`${data.baby.name}-summary-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
