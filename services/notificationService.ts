import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient();

let complaintChannel: RealtimeChannel | null = null;
let commentChannel: RealtimeChannel | null = null;

export function subscribeToComplaints(
  onNewComplaint: (complaint: Record<string, unknown>) => void
): () => void {
  // Wrap in setTimeout to avoid blocking component render
  const timeout = setTimeout(() => {
    try {
      complaintChannel = supabase
        .channel('complaints-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'complaints' },
          (payload) => {
            onNewComplaint(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('Failed to subscribe to complaints realtime. Manual polling will be used.');
            complaintChannel = null;
          }
        });
    } catch (error) {
      console.error('Error setting up complaints subscription:', error);
      complaintChannel = null;
    }
  }, 0);

  return () => {
    clearTimeout(timeout);
    if (complaintChannel) {
      supabase.removeChannel(complaintChannel);
      complaintChannel = null;
    }
  };
}

export function subscribeToComments(
  complaintId: string,
  onNewComment: (comment: Record<string, unknown>) => void
): () => void {
  // Wrap in setTimeout to avoid blocking component render
  const timeout = setTimeout(() => {
    try {
      commentChannel = supabase
        .channel(`comments-${complaintId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments',
            filter: `complaint_id=eq.${complaintId}`,
          },
          (payload) => {
            onNewComment(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn(`Failed to subscribe to comments for complaint ${complaintId}.`);
            commentChannel = null;
          }
        });
    } catch (error) {
      console.error('Error setting up comments subscription:', error);
      commentChannel = null;
    }
  }, 0);

  return () => {
    clearTimeout(timeout);
    if (commentChannel) {
      supabase.removeChannel(commentChannel);
      commentChannel = null;
    }
  };
}

export function subscribeToComplaintUpdates(
  onUpdate: (complaint: Record<string, unknown>) => void
): () => void {
  // Wrap in setTimeout to avoid blocking component render
  const timeout = setTimeout(() => {
    try {
      const channel = supabase
        .channel('complaint-updates')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'complaints' },
          (payload) => {
            onUpdate(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('Failed to subscribe to complaint updates.');
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error setting up complaint updates subscription:', error);
      return () => {};
    }
  }, 0);

  return () => {
    clearTimeout(timeout);
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
    });
  } else {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
    });
  }
}
