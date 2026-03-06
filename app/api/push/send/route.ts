import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(request: NextRequest) {
  const body = await request.json() as { title?: string; body?: string; url?: string };
  const { title, body: msgBody, url = '/' } = body;

  if (!title || !msgBody) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
  }

  // Use service role to bypass RLS and read subscriptions for managers/admins
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Find all user IDs with mess or admin role
  const { data: managerUsers } = await supabase
    .from('users')
    .select('id')
    .in('role', ['mess', 'admin']);

  const managerIds = (managerUsers ?? []).map((u: { id: string }) => u.id);
  if (managerIds.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 });
  }

  // Get their push subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .in('user_id', managerIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = JSON.stringify({ title, body: msgBody, url });

  const results = await Promise.allSettled(
    (subscriptions ?? []).map((sub: { endpoint: string; p256dh: string; auth_key: string }) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payload,
      )
    ),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return NextResponse.json({ sent, failed });
}
