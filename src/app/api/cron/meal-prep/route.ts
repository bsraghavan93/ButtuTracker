import { addDays, format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { itemsForDate } from "@/lib/mealPlan";
import type { Baby, MealPlanItem, PushSubscriptionRow } from "@/lib/types";

// Runs once a day (see vercel.json) the evening before, and pushes a
// real notification for any food-timetable entry scheduled for tomorrow
// that's flagged as needing prep the previous day.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    return Response.json({ error: "VAPID env vars are not configured" }, { status: 500 });
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const supabase = createAdminClient();

  const { data: babies } = await supabase.from("babies").select("*").order("created_at", { ascending: true }).limit(1);
  const baby = (babies as Baby[] | null)?.[0];
  if (!baby) return Response.json({ sent: 0, reason: "no baby row found" });

  const timezone = baby.timezone || "America/New_York";
  const tomorrowStr = format(addDays(toZonedTime(new Date(), timezone), 1), "yyyy-MM-dd");
  const tomorrow = parseISO(tomorrowStr);

  const { data: planRows } = await supabase.from("meal_plan_items").select("*").eq("baby_id", baby.id);
  const items = (planRows as MealPlanItem[] | null) ?? [];
  const prepItems = itemsForDate(items, tomorrow).filter((item) => item.prep_previous_day);

  if (prepItems.length === 0) {
    return Response.json({ sent: 0, reason: "nothing needs prep tomorrow" });
  }

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  const subscriptions = (subs as PushSubscriptionRow[] | null) ?? [];
  if (subscriptions.length === 0) {
    return Response.json({ sent: 0, reason: "no push subscriptions registered" });
  }

  const foodNames = prepItems.map((i) => i.food_name).join(", ");
  const payload = JSON.stringify({
    title: "Prep needed tonight",
    body: `Tomorrow's timetable needs: ${foodNames}`,
    url: "/food-timetable",
  });

  let sent = 0;
  const expiredEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) expiredEndpoints.push(sub.endpoint);
      }
    })
  );

  if (expiredEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
  }

  return Response.json({ sent, prepFoods: foodNames, cleanedUp: expiredEndpoints.length });
}
