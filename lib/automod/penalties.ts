import type { PenaltyAction, PenaltyState } from './types';

/**
 * Progressive penalty ladder:
 *   0 offenses → warning
 *   1           → final_warning
 *   2           → mute 10 min
 *   3           → mute 1 hour
 *   4           → mute 24 hours
 *   5+          → block 24 hours
 */

const LADDER: { action: PenaltyAction; durationMs: number | null; message: string }[] = [
  {
    action: 'warning',
    durationMs: null,
    message: 'Your reply contains inappropriate content. This is your first warning — please keep the discussion respectful.',
  },
  {
    action: 'final_warning',
    durationMs: null,
    message: 'This is your final warning. Continuing to post inappropriate content will result in a temporary mute.',
  },
  {
    action: 'mute_10m',
    durationMs: 10 * 60 * 1000,
    message: 'You have been muted for 10 minutes due to repeated violations.',
  },
  {
    action: 'mute_1h',
    durationMs: 60 * 60 * 1000,
    message: 'You have been muted for 1 hour due to continued violations.',
  },
  {
    action: 'mute_24h',
    durationMs: 24 * 60 * 60 * 1000,
    message: 'You have been muted for 24 hours due to continued violations.',
  },
  {
    action: 'block_24h',
    durationMs: 24 * 60 * 60 * 1000,
    message: 'You have been blocked from commenting for 24 hours due to severe or repeated violations.',
  },
];

/**
 * Compute the penalty based on number of prior offenses.
 * @param priorOffenses number of existing moderation_actions for this user
 */
export function computePenalty(priorOffenses: number): PenaltyState {
  const idx = Math.min(priorOffenses, LADDER.length - 1);
  const level = LADDER[idx];

  const mutedUntil = level.durationMs
    ? new Date(Date.now() + level.durationMs).toISOString()
    : null;

  return {
    offenseCount: priorOffenses + 1,
    action: level.action,
    mutedUntil,
    message: level.message,
  };
}

/**
 * Check if a user is currently under an active mute/block.
 * @param mutedUntil the muted_until timestamp from the most recent action
 * @returns remaining ms, or 0 if not muted
 */
export function getActiveMuteRemaining(mutedUntil: Date | string | null): number {
  if (!mutedUntil) return 0;
  const until = typeof mutedUntil === 'string' ? new Date(mutedUntil) : mutedUntil;
  const remaining = until.getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
}
