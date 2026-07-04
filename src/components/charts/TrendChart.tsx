"use client";

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export type TrendPoint = { label: string; value: number };

export function AreaTrendChart({ data, color = "#a78bfa", valueSuffix = "" }: { data: TrendPoint[]; color?: string; valueSuffix?: string }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "rgba(244,246,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(244,246,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={{ background: "rgba(20,20,35,0.9)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: "#fff" }}
          formatter={(v) => `${v ?? ""}${valueSuffix}`}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarTrendChart({ data, color = "#60a5fa", valueSuffix = "" }: { data: TrendPoint[]; color?: string; valueSuffix?: string }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "rgba(244,246,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(244,246,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={{ background: "rgba(20,20,35,0.9)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: "#fff" }}
          formatter={(v) => `${v ?? ""}${valueSuffix}`}
        />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
