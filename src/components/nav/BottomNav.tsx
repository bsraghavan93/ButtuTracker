"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Moon, Milk, Salad, Baby, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/sleep", label: "Sleep", icon: Moon },
  { href: "/feeding", label: "Feed", icon: Milk },
  { href: "/solids", label: "Solids", icon: Salad },
  { href: "/diapers", label: "Diapers", icon: Baby },
  { href: "/growth", label: "Growth", icon: TrendingUp },
];

export function BottomNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-xl px-3 pb-3">
        <div className="glass-strong relative flex items-center justify-between rounded-3xl px-2 py-2">
          {NAV_ITEMS.slice(0, 3).map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onQuickAdd}
            className="mx-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bt-purple to-bt-pink text-white shadow-lg shadow-purple-900/40 -translate-y-4"
            aria-label="Quick add"
          >
            <Plus size={26} />
          </motion.button>

          {NAV_ITEMS.slice(3).map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1.5 py-1.5 text-[10px] transition-colors",
        active ? "text-bt-pink" : "text-foreground/60"
      )}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      <span>{item.label}</span>
    </Link>
  );
}
