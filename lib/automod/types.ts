// ─── Automod Analysis Types ──────────────────────────────────

export interface Emotions {
  anger: number;
  disgust: number;
  fear: number;
  joy: number;
  sadness: number;
  surprise: number;
}

export interface AnalysisResult {
  sentiment: { score: number; label: 'positive' | 'negative' | 'neutral' };
  emotions: Emotions;
  profanity: {
    detected: boolean;
    severity: number; // 0–4
    matches: string[];
  };
  intensity: {
    score: number; // 0–1
    capsRatio: number;
    exclamationCount: number;
    repeatedCharScore: number;
  };
  socialTone: {
    politeness: number; // -1…1
    hostility: number; // 0…1
  };
  overallSeverity: number; // 0–10 composite
  action: 'allow' | 'flag' | 'warn' | 'block';
  suggestions: string[];
}

// ─── Penalty / Enforcement Types ─────────────────────────────

export type PenaltyAction =
  | 'warning'
  | 'final_warning'
  | 'mute_10m'
  | 'mute_1h'
  | 'mute_24h'
  | 'block_24h';

export interface PenaltyState {
  offenseCount: number;
  action: PenaltyAction;
  mutedUntil: string | null; // ISO timestamp
  message: string;
}

export interface ModerationResponse {
  allowed: boolean;
  analysis: AnalysisResult;
  penalty?: PenaltyState;
  message: string;
}

// ─── Lexicon Entry Types ─────────────────────────────────────

export interface ProfanityEntry {
  severity: 1 | 2 | 3 | 4;
  category: 'mild' | 'profanity' | 'slur' | 'sexual' | 'hate';
}
