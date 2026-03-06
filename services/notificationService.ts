import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient();

let complaintChannel: RealtimeChannel | null = null;
let commentChannel: RealtimeChannel | null = null;

export function subscribeToComplaints(
  onNewComplaint: (complaint: Record<string, unknown>) => void
): () => void {
  complaintChannel = supabase
    .channel('complaints-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'complaints' },
      (payload) => {
        onNewComplaint(payload.new);
      }
    )
    .subscribe();

  return () => {
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
    .subscribe();

  return () => {
    if (commentChannel) {
      supabase.removeChannel(commentChannel);
      commentChannel = null;
    }
  };
}

export function subscribeToComplaintUpdates(
  onUpdate: (complaint: Record<string, unknown>) => void
): () => void {
  const channel = supabase
    .channel('complaint-updates')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'complaints' },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
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
