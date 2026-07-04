"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { BottomNav } from "@/components/nav/BottomNav";
import { QuickAddSheet } from "@/components/quick-add/QuickAddSheet";
import { ActiveTimerCard } from "@/components/ui/ActiveTimerCard";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useBaby } from "@/lib/baby-context";
import { useActiveTimer } from "@/lib/hooks/useActiveTimer";
import { useBreastSession } from "@/lib/hooks/useBreastSession";
import { formatAge } from "@/lib/age";
import { createClient } from "@/lib/supabase/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const { baby } = useBaby();
  const timer = useActiveTimer(baby?.id);
  const breastSession = useBreastSession(baby?.id);
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleQuickLog(opts: { table: string; id: string; label: string }) {
    setToast({
      message: opts.label,
      onUndo: async () => {
        const supabase = createClient();
        await supabase.from(opts.table).delete().eq("id", opts.id);
        router.refresh();
      },
    });
    setTimeout(() => setToast((cur) => (cur?.message === opts.label ? null : cur)), 5000);
  }

  return (
    <div className="min-h-screen shrink-0 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-30 mx-auto flex max-w-xl items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3">
        <div>
          <p className="text-lg font-semibold">
            🍼 Buttu Tracker
          </p>
          {baby && (
            <p className="text-xs text-foreground/60">{baby.name} · {formatAge(baby.dob)}</p>
          )}
        </div>
        <button onClick={signOut} className="glass rounded-full p-2 text-foreground/70" aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </header>

      <ActiveTimerCard timer={timer} breastSession={breastSession} />

      <main className="mx-auto max-w-xl px-4">{children}</main>

      <BottomNav onQuickAdd={() => setQuickAddOpen(true)} />
      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onLogged={() => router.refresh()}
        timer={timer}
        breastSession={breastSession}
        onQuickLog={handleQuickLog}
      />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
