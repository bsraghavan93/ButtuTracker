"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center animate-floaty">
          <p className="text-4xl">🍼</p>
          <h1 className="mt-2 text-2xl font-semibold">Buttu Tracker</h1>
          <p className="text-sm text-foreground/60">Sleep, feeds, solids &amp; more — all in one place</p>
        </div>

        <GlassCard strong className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground/70">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass rounded-xl px-3 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-bt-purple/60"
                placeholder="parent@example.com"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground/70">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass rounded-xl px-3 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-bt-purple/60"
                placeholder="••••••••"
              />
            </label>
            {error && <p className="text-sm text-bt-red">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </GlassCard>

        <p className="mt-6 text-center text-sm text-foreground/60">
          New here?{" "}
          <Link href="/signup" className="text-bt-pink font-medium">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
