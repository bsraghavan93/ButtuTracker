"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { disablePushNotifications, enablePushNotifications, getCurrentSubscription, pushSupported } from "@/lib/push";

export function NotificationToggle() {
  const [supported] = useState(() => pushSupported());
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const sub = await getCurrentSubscription();
      setSubscribed(!!sub);
    }
    check();
  }, []);

  async function handleClick() {
    setBusy(true);
    setError(null);
    if (subscribed) {
      await disablePushNotifications();
      setSubscribed(false);
    } else {
      const result = await enablePushNotifications();
      if (result.ok) {
        setSubscribed(true);
      } else {
        setError(result.error ?? "Couldn't enable notifications.");
      }
    }
    setBusy(false);
  }

  if (!supported) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant={subscribed ? "ghost" : "primary"}
        onClick={handleClick}
        disabled={busy}
        className="flex items-center justify-center gap-2"
      >
        {subscribed ? <BellRing size={16} /> : <Bell size={16} />}
        {busy ? "Working…" : subscribed ? "Prep reminders on" : "Enable prep reminders"}
      </Button>
      {error && (
        <p className="flex items-center gap-1 text-xs text-bt-red">
          <BellOff size={12} /> {error}
        </p>
      )}
    </div>
  );
}
