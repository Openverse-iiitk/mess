import { NextRequest, NextResponse } from 'next/server';
import { analyze } from '@/lib/automod/analyzer';

/**
 * POST /api/moderation/analyze
 * Live content analysis — no DB, no side-effects.
 * Used by ComplaintForm for real-time feedback while typing.
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = (await request.json()) as { text?: string };
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const analysis = analyze(text);
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
