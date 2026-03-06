'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle } from 'lucide-react';

export function PushNotificationManager() {
  const { isManager, user } = useAuth();
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!isManager || !user) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    let cancelled = false;

    async function enablePush() {
      try {
        // Request permission immediately (forces browser prompt)
        const permission = await Notification.requestPermission();
        
        if (cancelled) return;

        if (permission !== 'granted') {
          setPermissionDenied(true);
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          });
        }

        if (cancelled) return;

        // Send subscription to server
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

        setPermissionDenied(false);
      } catch {
        // Silently handle errors
      }
    }

    enablePush();
    return () => {
      cancelled = true;
    };
  }, [isManager, user?.id]);

  if (permissionDenied && isManager) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm shadow-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-foreground">
            Please enable notifications in your browser settings to receive complaint & expense alerts.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
