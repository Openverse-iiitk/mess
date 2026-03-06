'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  subscribeToComplaints,
  requestNotificationPermission,
  showNotification,
} from '@/services/notificationService';

interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

export function useNotifications() {
  const { isManager } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  useEffect(() => {
    if (!isManager || initialized.current) return;
    initialized.current = true;

    const unsub = subscribeToComplaints((complaint) => {
      const c = complaint as { title?: string; description?: string };
      const title = 'New Complaint';
      const body = c.title || 'A new complaint has been filed';

      const notification: AppNotification = {
        id: crypto.randomUUID(),
        title,
        body,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [notification, ...prev].slice(0, 50));

      if (permissionGranted) {
        showNotification(title, body);
      }
    });

    return () => {
      unsub();
      initialized.current = false;
    };
  }, [isManager, permissionGranted]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    permissionGranted,
    requestPermission,
    markAsRead,
    markAllAsRead,
  };
}
