export { analyze } from './analyzer';
export { normalize, tokenize } from './analyzer';
export { computePenalty, getActiveMuteRemaining } from './penalties';
export type {
  AnalysisResult,
  Emotions,
  PenaltyAction,
  PenaltyState,
  ModerationResponse,
  ProfanityEntry,
} from './types';
