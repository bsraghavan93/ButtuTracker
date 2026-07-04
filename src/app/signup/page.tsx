"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setInfo("Check your email to confirm your account, then sign in.");
    }
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
          <p className="text-4xl">👶</p>
          <h1 className="mt-2 text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-foreground/60">Set up Buttu&apos;s tracker in seconds</p>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass rounded-xl px-3 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-bt-purple/60"
                placeholder="At least 6 characters"
              />
            </label>
            {error && <p className="text-sm text-bt-red">{error}</p>}
            {info && <p className="text-sm text-bt-teal">{info}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </GlassCard>

        <p className="mt-6 text-center text-sm text-foreground/60">
          Already have an account?{" "}
          <Link href="/login" className="text-bt-pink font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
