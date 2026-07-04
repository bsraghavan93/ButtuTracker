import { BabyProvider } from "@/lib/baby-context";
import { AppShell } from "@/components/nav/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BabyProvider>
      <AppShell>{children}</AppShell>
    </BabyProvider>
  );
}
