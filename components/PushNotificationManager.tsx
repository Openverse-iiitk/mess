'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function PushNotificationManager() {
  const { isManager, user } = useAuth();

  useEffect(() => {
    if (!isManager || !user) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    let cancelled = false;

    async function subscribe() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted' || cancelled) return;

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          });
        }

        if (cancelled) return;

        const json = subscription.toJSON();
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: json.endpoint,
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          }),
        });
      } catch {
        // Push is a progressive enhancement — silently ignore errors
      }
    }

    subscribe();
    return () => {
      cancelled = true;
    };
  }, [isManager, user?.id]);

  return null;
}
