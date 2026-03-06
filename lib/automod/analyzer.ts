import type { AnalysisResult, Emotions } from './types';
import {
  PROFANITY_MAP,
  PROFANITY_PHRASES,
  SENTIMENT_MAP,
  EMOTION_MAP,
  INTENSIFIERS,
  NEGATION_WORDS,
  POLITENESS_MARKERS,
  HOSTILITY_MARKERS,
} from './lexicons';

// ═══════════════════════════════════════════════════════════════
// TEXT NORMALIZATION
// ═══════════════════════════════════════════════════════════════

const LEET_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i',
  '(': 'c', '|': 'l', '+': 't',
};

/** Decode leet speak: f@ck → fack, $hit → shit */
function deobfuscate(text: string): string {
  return text.replace(/[013457@$!|+(]/g, (ch) => LEET_MAP[ch] ?? ch);
}

/**
 * Remove punctuation/symbols inserted between letters to evade filters.
 * E.g. "f.u.c.k" → "fuck", "s h i t" → "shit"
 */
function removeInsertedSeparators(text: string): string {
  // Match pattern: letter, separator, letter, separator, letter …
  // where separator is 1 non-alphanumeric char and segments are single letters
  return text.replace(
    /\b([a-zA-Z])[.\-_*#\s]([a-zA-Z])[.\-_*#\s]([a-zA-Z])(?:[.\-_*#\s]([a-zA-Z]))*/g,
    (...args) => {
      // Rebuild the word from captured single-char groups
      const full = args[0] as string;
      return full.replace(/[.\-_*#\s]/g, '');
    }
  );
}

/** Compress repeated characters: loooove → loove, shiiiit → shiit */
function compressRepeats(text: string): string {
  return text.replace(/(.)\1{2,}/g, '$1$1');
}

/** Strip accents / diacritics (Latin) */
function stripAccents(text: string): string {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

/** Full normalization pipeline for matching */
export function normalize(text: string): string {
  let t = text;
  t = t.normalize('NFKC');
  t = stripAccents(t);
  t = t.toLowerCase();
  t = deobfuscate(t);
  t = removeInsertedSeparators(t);
  t = compressRepeats(t);
  // Strip non-alphanumeric except spaces and Indic Unicode blocks
  t = t.replace(/[^\w\s\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0B00-\u0B7F\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

/** Tokenize into words, handling Indic + Latin scripts */
export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════
// PROFANITY CHECK
// ═══════════════════════════════════════════════════════════════

interface ProfanityResult {
  detected: boolean;
  severity: number;
  matches: string[];
}

function checkProfanity(normalizedText: string, tokens: string[]): ProfanityResult {
  const matches: string[] = [];
  let maxSeverity = 0;

  // Token-level check
  for (const token of tokens) {
    const entry = PROFANITY_MAP.get(token);
    if (entry) {
      matches.push(token);
      maxSeverity = Math.max(maxSeverity, entry.severity);
    }
  }

  // Check original text against native-script entries (Devanagari, etc.)
  for (const [word, entry] of PROFANITY_MAP) {
    // Only check non-ASCII entries against original text (already normalized)
    if (/[^\x00-\x7F]/.test(word) && normalizedText.includes(word)) {
      if (!matches.includes(word)) {
        matches.push(word);
        maxSeverity = Math.max(maxSeverity, entry.severity);
      }
    }
  }

  // Phrase check
  for (const { phrase, severity } of PROFANITY_PHRASES) {
    if (normalizedText.includes(phrase)) {
      matches.push(phrase);
      maxSeverity = Math.max(maxSeverity, severity);
    }
  }

  return { detected: matches.length > 0, severity: maxSeverity, matches };
}

// ═══════════════════════════════════════════════════════════════
// SENTIMENT ANALYSIS  (AFINN-style with negation + intensifiers)
// ═══════════════════════════════════════════════════════════════

function analyzeSentiment(tokens: string[]): { score: number; label: 'positive' | 'negative' | 'neutral' } {
  let total = 0;
  let count = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const val = SENTIMENT_MAP.get(token);
    if (val === undefined) continue;

    let score = val;

    // Check preceding intensifier
    if (i > 0) {
      const mult = INTENSIFIERS.get(tokens[i - 1]);
      if (mult) score *= mult;
    }

    // Check preceding negation (window of 3 words)
    let negated = false;
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (NEGATION_WORDS.has(tokens[j])) { negated = true; break; }
    }
    if (negated) score *= -0.75; // Partial flip

    total += score;
    count++;
  }

  const avg = count > 0 ? total / count : 0;
  const label = avg > 0.5 ? 'positive' : avg < -0.5 ? 'negative' : 'neutral';
  return { score: Math.round(avg * 100) / 100, label };
}

// ═══════════════════════════════════════════════════════════════
// EMOTION ANALYSIS  (NRC-style lexicon lookup + aggregation)
// ═══════════════════════════════════════════════════════════════

function analyzeEmotions(tokens: string[]): Emotions {
  const totals: Emotions = { anger: 0, disgust: 0, fear: 0, joy: 0, sadness: 0, surprise: 0 };
  let hits = 0;

  for (const token of tokens) {
    const emo = EMOTION_MAP.get(token);
    if (!emo) continue;
    hits++;
    for (const key of Object.keys(totals) as (keyof Emotions)[]) {
      totals[key] += emo[key] ?? 0;
    }
  }

  // Normalize to 0…1 range
  if (hits > 0) {
    for (const key of Object.keys(totals) as (keyof Emotions)[]) {
      totals[key] = Math.min(1, Math.round((totals[key] / hits) * 100) / 100);
    }
  }

  return totals;
}

// ═══════════════════════════════════════════════════════════════
// INTENSITY ANALYSIS  (caps, punctuation, repetition)
// ═══════════════════════════════════════════════════════════════

interface IntensityResult {
  score: number;
  capsRatio: number;
  exclamationCount: number;
  repeatedCharScore: number;
}

function analyzeIntensity(rawText: string): IntensityResult {
  const letters = rawText.replace(/[^a-zA-Z]/g, '');
  const upperLetters = letters.replace(/[^A-Z]/g, '');
  const capsRatio = letters.length > 0 ? upperLetters.length / letters.length : 0;

  const exclamationCount = (rawText.match(/!/g) || []).length;
  const questionCount = (rawText.match(/\?/g) || []).length;

  // Score repeated characters (before compression)
  const repeatedMatches = rawText.match(/(.)\1{2,}/g) || [];
  const repeatedCharScore = Math.min(1, repeatedMatches.length * 0.3);

  // Composite intensity: 0…1
  const score = Math.min(1,
    (capsRatio > 0.6 ? capsRatio * 0.4 : 0) +
    Math.min(0.3, exclamationCount * 0.05) +
    Math.min(0.2, questionCount * 0.03) +
    repeatedCharScore * 0.2
  );

  return { score: Math.round(score * 100) / 100, capsRatio: Math.round(capsRatio * 100) / 100, exclamationCount, repeatedCharScore: Math.round(repeatedCharScore * 100) / 100 };
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL TONE  (politeness vs hostility)
// ═══════════════════════════════════════════════════════════════

function analyzeSocialTone(tokens: string[]): { politeness: number; hostility: number } {
  let polite = 0;
  let hostile = 0;

  for (const token of tokens) {
    if (POLITENESS_MARKERS.has(token)) polite++;
    if (HOSTILITY_MARKERS.has(token)) hostile++;
  }

  const total = tokens.length || 1;
  return {
    politeness: Math.min(1, Math.round((polite / total) * 10 * 100) / 100),
    hostility: Math.min(1, Math.round((hostile / total) * 10 * 100) / 100),
  };
}

// ═══════════════════════════════════════════════════════════════
// SARCASM / POLARITY SHIFT HEURISTICS
// ═══════════════════════════════════════════════════════════════

function detectSarcasm(rawText: string, sentimentScore: number): boolean {
  const lower = rawText.toLowerCase();
  // Patterns like "Great... just great." or "Yeah, right"
  const sarcasmPatterns = [
    /great\.{2,}/,
    /yeah[,.]?\s*right/,
    /sure[,.]?\s*sure/,
    /wonderful\.{2,}/,
    /amazing\.{2,}/,
    /oh\s+wow/,
    /totally\s+fine/,
  ];
  const hasSarcasmPattern = sarcasmPatterns.some((p) => p.test(lower));
  // Positive words + ellipsis often signals sarcasm
  const hasEllipsisAfterPositive = /(?:good|great|nice|fine|wonderful|amazing)\s*\.{3}/i.test(rawText);

  return hasSarcasmPattern || hasEllipsisAfterPositive;
}

// ═══════════════════════════════════════════════════════════════
// VERDICT & SUGGESTIONS
// ═══════════════════════════════════════════════════════════════

function computeVerdict(
  profanity: ProfanityResult,
  sentiment: { score: number; label: string },
  emotions: Emotions,
  intensity: IntensityResult,
  socialTone: { politeness: number; hostility: number },
  isSarcastic: boolean,
): { overallSeverity: number; action: AnalysisResult['action']; suggestions: string[] } {
  const suggestions: string[] = [];
  let severity = 0;

  // Profanity contribution (heaviest weight)
  if (profanity.detected) {
    severity += profanity.severity * 2; // 2–8 points
    if (profanity.severity >= 3) {
      suggestions.push('Your message contains strong language that will be blocked. Please rephrase without profanity.');
    } else if (profanity.severity >= 2) {
      suggestions.push('Your message contains some inappropriate language. Consider toning it down.');
    } else {
      suggestions.push('Minor language issue detected. You may want to rephrase for a better tone.');
    }
  }

  // Emotion contribution
  if (emotions.anger > 0.7) {
    severity += 1.5;
    suggestions.push('Your message sounds very angry. Try to describe the specific issue calmly — it helps the committee act faster.');
  } else if (emotions.anger > 0.4) {
    severity += 0.5;
  }

  if (emotions.disgust > 0.7) {
    severity += 1;
    suggestions.push('Instead of expressing disgust, describe what exactly was wrong (e.g., food quality, cleanliness).');
  }

  // Hostility contribution
  if (socialTone.hostility > 0.5) {
    severity += 1.5;
    suggestions.push('Your message contains threatening or hostile language. Please keep it respectful.');
  } else if (socialTone.hostility > 0.2) {
    severity += 0.5;
  }

  // Intensity bonus
  if (intensity.score > 0.5) {
    severity += 1;
    if (intensity.capsRatio > 0.6) {
      suggestions.push('Typing in ALL CAPS is considered shouting. Try using normal case.');
    }
    if (intensity.exclamationCount > 3) {
      suggestions.push('Multiple exclamation marks add to perceived aggression. Consider using fewer.');
    }
  }

  // Politeness discount
  if (socialTone.politeness > 0.3) {
    severity = Math.max(0, severity - 1);
  }

  // Sarcasm bump
  if (isSarcastic && sentiment.score > 0) {
    severity += 0.5;
    suggestions.push('Your message may come across as sarcastic. Being direct helps get your concern addressed.');
  }

  // Negative sentiment without profanity — that's okay, it's a complaint
  // Only flag if combined with other signals
  if (sentiment.score < -3 && profanity.severity === 0 && emotions.anger < 0.5) {
    // Just negative sentiment is fine for complaints, no action needed
  }

  severity = Math.min(10, Math.round(severity * 100) / 100);

  let action: AnalysisResult['action'];
  if (severity >= 6) action = 'block';
  else if (severity >= 4) action = 'warn';
  else if (severity >= 2) action = 'flag';
  else action = 'allow';

  if (suggestions.length === 0 && action === 'allow') {
    suggestions.push('Your message looks good!');
  }

  return { overallSeverity: severity, action, suggestions };
}

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS ENTRY POINT
// ═══════════════════════════════════════════════════════════════

export function analyze(text: string): AnalysisResult {
  if (!text || text.trim().length === 0) {
    return {
      sentiment: { score: 0, label: 'neutral' },
      emotions: { anger: 0, disgust: 0, fear: 0, joy: 0, sadness: 0, surprise: 0 },
      profanity: { detected: false, severity: 0, matches: [] },
      intensity: { score: 0, capsRatio: 0, exclamationCount: 0, repeatedCharScore: 0 },
      socialTone: { politeness: 0, hostility: 0 },
      overallSeverity: 0,
      action: 'allow',
      suggestions: [],
    };
  }

  // 1. Intensity from raw text (before normalization)
  const intensity = analyzeIntensity(text);

  // 2. Normalize and tokenize
  const normalizedText = normalize(text);
  const tokens = tokenize(normalizedText);

  // 3. Profanity detection
  const profanity = checkProfanity(normalizedText, tokens);

  // 4. Sentiment
  const sentiment = analyzeSentiment(tokens);

  // 5. Emotions
  const emotions = analyzeEmotions(tokens);

  // 6. Social tone
  const socialTone = analyzeSocialTone(tokens);

  // 7. Sarcasm heuristics
  const isSarcastic = detectSarcasm(text, sentiment.score);

  // 8. Compute verdict
  const { overallSeverity, action, suggestions } = computeVerdict(
    profanity, sentiment, emotions, intensity, socialTone, isSarcastic,
  );

  return {
    sentiment,
    emotions,
    profanity,
    intensity,
    socialTone,
    overallSeverity,
    action,
    suggestions,
  };
}
