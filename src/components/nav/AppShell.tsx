"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { BottomNav } from "@/components/nav/BottomNav";
import { QuickAddSheet } from "@/components/quick-add/QuickAddSheet";
import { useBaby } from "@/lib/baby-context";
import { formatAge } from "@/lib/age";
import { createClient } from "@/lib/supabase/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { baby } = useBaby();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen pb-32">
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

      <main className="mx-auto max-w-xl px-4">{children}</main>

      <BottomNav onQuickAdd={() => setQuickAddOpen(true)} />
      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onLogged={() => router.refresh()}
      />
    </div>
  );
}
