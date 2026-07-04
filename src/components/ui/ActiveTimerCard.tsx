"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Milk, Square } from "lucide-react";
import type { ActiveTimer } from "@/lib/hooks/useActiveTimer";

function elapsedLabel(since: string) {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function TimerRow({
  icon: Icon,
  label,
  since,
  onStop,
}: {
  icon: typeof Moon;
  label: string;
  since: string;
  onStop: () => void;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-bt-purple to-bt-pink px-4 py-3 text-white shadow-lg shadow-purple-900/30"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
      </span>
      <Icon size={18} className="shrink-0" />
      <div className="flex-1 leading-tight">
        <p className="text-sm font-medium">{label}</p>
        <p className="font-mono text-lg tabular-nums">{elapsedLabel(since)}</p>
      </div>
      <button
        onClick={onStop}
        className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium"
      >
        <Square size={12} fill="currentColor" /> Stop
      </button>
    </motion.div>
  );
}

export function ActiveTimerCard({ timer }: { timer: ActiveTimer }) {
  const { activeSleep, activeFeed, stopSleep, stopFeed } = timer;

  if (!activeSleep && !activeFeed) return null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2 px-4 pb-2">
      <AnimatePresence>
        {activeSleep && (
          <TimerRow
            key="sleep"
            icon={Moon}
            label={activeSleep.type === "nap" ? "Nap in progress" : "Night sleep in progress"}
            since={activeSleep.start_time}
            onStop={() => stopSleep()}
          />
        )}
        {activeFeed && (
          <TimerRow
            key="feed"
            icon={Milk}
            label={activeFeed.type === "breast" ? `Feeding${activeFeed.side ? ` · ${activeFeed.side}` : ""}` : "Pumping"}
            since={activeFeed.occurred_at}
            onStop={() => stopFeed()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
