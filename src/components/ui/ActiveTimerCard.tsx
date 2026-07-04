"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Milk, Square } from "lucide-react";
import type { ActiveTimer } from "@/lib/hooks/useActiveTimer";
import type { BreastSessionHook } from "@/lib/hooks/useBreastSession";

function elapsedLabel(totalMs: number) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function CardShell({
  icon: Icon,
  label,
  value,
  onStop,
}: {
  icon: typeof Moon;
  label: string;
  value: string;
  onStop: () => void;
}) {
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
        <p className="font-mono text-lg tabular-nums">{value}</p>
      </div>
      <button onClick={onStop} className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium">
        <Square size={12} fill="currentColor" /> Stop
      </button>
    </motion.div>
  );
}

function TimerRow({ icon, label, since, onStop }: { icon: typeof Moon; label: string; since: string; onStop: () => void }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const sinceMs = new Date(since).getTime();
    function tick() {
      setElapsed(Date.now() - sinceMs);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);

  return <CardShell icon={icon} label={label} value={elapsedLabel(elapsed)} onStop={onStop} />;
}

function BreastTimerRow({ breastSession }: { breastSession: BreastSessionHook }) {
  const { elapsedMs, save, session } = breastSession;
  const [value, setValue] = useState("");

  useEffect(() => {
    function tick() {
      setValue(`L ${elapsedLabel(elapsedMs("left"))} · R ${elapsedLabel(elapsedMs("right"))}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [elapsedMs]);

  if (!session) return null;

  return <CardShell icon={Milk} label="Feeding in progress" value={value} onStop={() => save()} />;
}

export function ActiveTimerCard({ timer, breastSession }: { timer: ActiveTimer; breastSession: BreastSessionHook }) {
  const { activeSleep, activeFeed, stopSleep, stopFeed } = timer;

  if (!activeSleep && !activeFeed && !breastSession.hasSession) return null;

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
        {activeFeed && <TimerRow key="feed" icon={Milk} label="Pumping in progress" since={activeFeed.occurred_at} onStop={() => stopFeed()} />}
        {breastSession.hasSession && <BreastTimerRow key="breast" breastSession={breastSession} />}
      </AnimatePresence>
    </div>
  );
}
