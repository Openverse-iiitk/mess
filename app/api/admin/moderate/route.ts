import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/admin/moderate
 * Admin actions: ban/unban a user by anon_id.
 * Requires authenticated admin.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const serviceClient = getServiceClient();

    const { data: profile } = await serviceClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // ── Parse body ──────────────────────────────────────────
    const body = (await request.json()) as {
      action?: 'ban' | 'unban';
      anon_id?: string;
      reason?: string;
      duration_hours?: number;
    };

    const { action, anon_id, reason, duration_hours } = body;

    if (!action || !anon_id) {
      return NextResponse.json({ error: 'action and anon_id are required' }, { status: 400 });
    }

    // ── Ban ─────────────────────────────────────────────────
    if (action === 'ban') {
      const expiresAt = duration_hours
        ? new Date(Date.now() + duration_hours * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await serviceClient.from('admin_bans').insert({
        identifier_type: 'anon_id',
        identifier_value: anon_id,
        reason: reason || 'Banned by admin',
        banned_by: user.id,
        expires_at: expiresAt,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `User banned${duration_hours ? ` for ${duration_hours} hours` : ' permanently'}`,
      });
    }

    // ── Unban ───────────────────────────────────────────────
    if (action === 'unban') {
      const { error } = await serviceClient
        .from('admin_bans')
        .delete()
        .eq('identifier_type', 'anon_id')
        .eq('identifier_value', anon_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'User unbanned' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Moderation action failed' }, { status: 500 });
  }
}
