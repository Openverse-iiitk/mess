import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { analyze } from '@/lib/automod/analyzer';
import { computePenalty, getActiveMuteRemaining } from '@/lib/automod/penalties';
import type { AuthorRole } from '@/types/database';

// Service-role client to bypass RLS for moderation tables
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/comments
 * Server-side comment creation with moderation + progressive penalties.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      complaint_id?: string;
      comment_text?: string;
      parent_comment_id?: string | null;
    };

    const { complaint_id, comment_text, parent_comment_id } = body;
    if (!complaint_id || !comment_text || typeof comment_text !== 'string') {
      return NextResponse.json({ error: 'complaint_id and comment_text are required' }, { status: 400 });
    }

    // ── Identity ────────────────────────────────────────────
    const anonId = request.headers.get('x-anon-id') || '';
    if (!anonId) {
      return NextResponse.json({ error: 'X-Anon-Id header is required' }, { status: 400 });
    }

    const serviceClient = getServiceClient();

    // ── Check admin ban ─────────────────────────────────────
    const { data: activeBan } = await serviceClient
      .from('admin_bans')
      .select('id, reason, expires_at')
      .eq('identifier_type', 'anon_id')
      .eq('identifier_value', anonId)
      .or('expires_at.is.null,expires_at.gt.now()')
      .limit(1)
      .maybeSingle();

    if (activeBan) {
      return NextResponse.json({
        allowed: false,
        message: 'You have been blocked from commenting by an administrator.',
        penalty: { action: 'block_24h', message: activeBan.reason || 'Blocked by admin' },
      }, { status: 403 });
    }

    // ── Check active mute ───────────────────────────────────
    const { data: latestAction } = await serviceClient
      .from('moderation_actions')
      .select('muted_until')
      .eq('anon_id', anonId)
      .not('muted_until', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestAction?.muted_until) {
      const remaining = getActiveMuteRemaining(latestAction.muted_until);
      if (remaining > 0) {
        const minutes = Math.ceil(remaining / 60000);
        return NextResponse.json({
          allowed: false,
          message: `You are temporarily muted. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
          penalty: {
            action: 'muted',
            mutedUntil: latestAction.muted_until,
            message: `Muted for ${minutes} more minute${minutes !== 1 ? 's' : ''}`,
          },
        }, { status: 403 });
      }
    }

    // ── Run analysis ────────────────────────────────────────
    const analysis = analyze(comment_text);

    // ── Decide action ───────────────────────────────────────
    if (analysis.action === 'warn' || analysis.action === 'block') {
      // Count prior offenses for this anon_id
      const { count } = await serviceClient
        .from('moderation_actions')
        .select('id', { count: 'exact', head: true })
        .eq('anon_id', anonId);

      const priorOffenses = count ?? 0;
      const penalty = computePenalty(priorOffenses);

      // Record the offense
      await serviceClient.from('moderation_actions').insert({
        anon_id: anonId,
        offense_type: analysis.profanity.detected ? 'profanity' : 'harassment',
        severity_score: analysis.overallSeverity,
        action_taken: penalty.action,
        muted_until: penalty.mutedUntil,
        reference_type: 'comment',
        details: {
          text_snippet: comment_text.slice(0, 200),
          analysis_summary: {
            profanity_severity: analysis.profanity.severity,
            sentiment: analysis.sentiment.label,
            anger: analysis.emotions.anger,
          },
        },
      });

      return NextResponse.json({
        allowed: false,
        analysis,
        penalty,
        message: penalty.message,
      }, { status: 403 });
    }

    // ── Resolve author ──────────────────────────────────────
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    let authorId: string | null = null;
    let authorRole: AuthorRole = 'viewer';

    if (user) {
      authorId = user.id;
      const { data: userData } = await serviceClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      authorRole = (userData?.role as AuthorRole) ?? 'viewer';
    }

    // ── Insert comment ──────────────────────────────────────
    const moderationStatus = analysis.action === 'flag' ? 'flagged' : 'clean';

    const { data: comment, error } = await serviceClient
      .from('comments')
      .insert({
        complaint_id,
        comment_text,
        parent_comment_id: parent_comment_id ?? null,
        author_id: authorId,
        author_role: authorRole,
        anon_id: anonId,
        moderation_status: moderationStatus,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      allowed: true,
      comment,
      analysis: analysis.action === 'flag' ? analysis : undefined,
      message: analysis.action === 'flag'
        ? 'Your comment was posted but flagged for review.'
        : undefined,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
