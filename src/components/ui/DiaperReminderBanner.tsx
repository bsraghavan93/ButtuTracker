"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Baby, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { LastDiaperHook } from "@/lib/hooks/useLastDiaper";

const STALE_HOURS = 3;

function dismissKey(babyId: string) {
  return `buttu:diaper-reminder-dismissed:${babyId}`;
}

function elapsedLabel(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

export function DiaperReminderBanner({
  babyId,
  diaper,
  onLogDiaper,
}: {
  babyId: string;
  diaper: LastDiaperHook;
  onLogDiaper: () => void;
}) {
  const { lastDiaper, loaded, refresh } = diaper;
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing dismissal flag from localStorage on mount/babyId change
    setDismissedFor(localStorage.getItem(dismissKey(babyId)));
  }, [babyId]);

  useEffect(() => {
    function tick() {
      setNow(Date.now());
    }
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const currentKey = lastDiaper?.id ?? "none";
  const hoursSince = lastDiaper && now !== null ? (now - new Date(lastDiaper.occurred_at).getTime()) / 3600000 : null;
  const stale = loaded && (!lastDiaper || (hoursSince !== null && hoursSince >= STALE_HOURS));
  const visible = stale && dismissedFor !== currentKey;

  function dismiss() {
    localStorage.setItem(dismissKey(babyId), currentKey);
    setDismissedFor(currentKey);
  }

  async function logNow() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("diaper_logs").insert({ baby_id: babyId, type: "wet", occurred_at: new Date().toISOString() });
    setBusy(false);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-2">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-bt-amber/90 to-bt-red/80 p-4 text-white shadow-lg"
          >
            <Baby size={20} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {lastDiaper && hoursSince !== null
                  ? `Diaper check — last changed ${elapsedLabel(hoursSince)}`
                  : "No diaper logged yet — check on Buttu?"}
              </p>
              <div className="mt-2 flex gap-2">
                <button onClick={onLogDiaper} className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium">
                  Log diaper
                </button>
                <button onClick={logNow} disabled={busy} className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium disabled:opacity-50">
                  {busy ? "Logging…" : "Already changed"}
                </button>
              </div>
            </div>
            <button onClick={dismiss} className="shrink-0 rounded-full p-1 hover:bg-white/10" aria-label="Dismiss">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
