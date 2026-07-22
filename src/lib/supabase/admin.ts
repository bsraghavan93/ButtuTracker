import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-only routes (e.g. the meal-prep cron) that
 * must read/write data without a signed-in user session — the RLS policies
 * in this app require `auth.uid() is not null`, which a cron request can't
 * satisfy. Never import this from client components.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
