import type { ProfanityEntry, Emotions } from './types';

// ═══════════════════════════════════════════════════════════════
// PROFANITY LEXICON
// severity: 1 = mild, 2 = moderate, 3 = severe, 4 = extreme
// Entries are matched after normalization (lowercase, leet-speak
// decoded, repeated chars compressed, inserted punctuation removed).
// ═══════════════════════════════════════════════════════════════

const p = (severity: ProfanityEntry['severity'], category: ProfanityEntry['category'] = 'profanity'): ProfanityEntry =>
  ({ severity, category });

/** Single-token profanity map (normalized forms) */
export const PROFANITY_MAP: Map<string, ProfanityEntry> = new Map([
  // ── English ───────────────────────────────────────────────
  ['fuck', p(3)], ['fucker', p(3)], ['fucking', p(3)], ['fucked', p(3)],
  ['fck', p(3)], ['fuk', p(3)], ['stfu', p(3)],
  ['shit', p(2)], ['shitty', p(2)], ['bullshit', p(3)],
  ['bitch', p(2)], ['bitchy', p(2)],
  ['ass', p(1, 'mild')], ['asshole', p(3)], ['arsehole', p(3)],
  ['bastard', p(2)], ['damn', p(1, 'mild')], ['crap', p(1, 'mild')],
  ['dick', p(2)], ['cock', p(2)], ['penis', p(1, 'sexual')],
  ['pussy', p(3, 'sexual')], ['whore', p(3, 'sexual')],
  ['slut', p(3, 'sexual')], ['porn', p(2, 'sexual')],
  ['retard', p(3, 'slur')], ['retarded', p(3, 'slur')],
  ['idiot', p(1, 'mild')], ['moron', p(1, 'mild')], ['stupid', p(1, 'mild')],
  ['dumb', p(1, 'mild')], ['loser', p(1, 'mild')],
  ['nigger', p(4, 'hate')], ['nigga', p(4, 'hate')],
  ['faggot', p(4, 'hate')], ['fag', p(3, 'hate')],
  ['tranny', p(4, 'hate')], ['kike', p(4, 'hate')],
  ['spic', p(4, 'hate')], ['chink', p(4, 'hate')],
  ['cunt', p(4)], ['twat', p(3)], ['wanker', p(2)],
  ['piss', p(1, 'mild')], ['pissed', p(1, 'mild')],
  ['wtf', p(2)], ['lmao', p(1, 'mild')],
  ['motherfucker', p(4)], ['mf', p(3)],

  // ── Hindi (romanized) ─────────────────────────────────────
  ['chutiya', p(3)], ['chutiye', p(3)], ['chootiya', p(3)], ['chutia', p(3)],
  ['behenchod', p(4)], ['bhenchod', p(4)], ['bkl', p(4)], ['bhenchod', p(4)],
  ['madarchod', p(4)], ['maderchod', p(4)],
  ['bc', p(4)], ['mc', p(4)], ['bsdk', p(4)], ['bhosdike', p(4)],
  ['bhosdiwale', p(4)], ['bhosdi', p(4)], ['bhosdika', p(4)],
  ['gandu', p(3)], ['gaandu', p(3)],
  ['lodu', p(3)], ['lode', p(3)], ['laude', p(3)], ['lavde', p(3)],
  ['randi', p(3, 'sexual')], ['raand', p(3, 'sexual')], ['randa', p(3, 'sexual')],
  ['harami', p(2)], ['haramkhor', p(2)], ['haraamii', p(2)],
  ['kamina', p(2)], ['kamine', p(2)], ['kamini', p(2)],
  ['saala', p(1, 'mild')], ['sala', p(1, 'mild')], ['saale', p(1, 'mild')],
  ['kutta', p(2)], ['kutte', p(2)], ['kutiya', p(3, 'sexual')],
  ['gadha', p(1, 'mild')], ['gadhe', p(1, 'mild')],
  ['ullu', p(1, 'mild')], ['nalayak', p(1, 'mild')],
  ['jhatu', p(2)], ['jhaatu', p(2)],
  ['tatti', p(2)], ['tatte', p(2)],
  ['gaand', p(3)], ['gand', p(3)],
  ['chod', p(3)], ['chodhna', p(3)],
  ['bhadwa', p(3)], ['bhadwe', p(3)],
  ['panchod', p(4)], ['benchod', p(4)],
  ['betichod', p(4)], ['laudu', p(3)],
  ['chirkut', p(1, 'mild')], ['bevda', p(1, 'mild')],
  ['haramzada', p(3)], ['haramzade', p(3)], ['haramzadi', p(3)],
  ['bakchod', p(3)], ['bakchodi', p(3)],
  ['lund', p(3, 'sexual')], ['phuddi', p(3, 'sexual')],
  ['maal', p(2, 'sexual')], ['item', p(1, 'sexual')],
  ['raandwa', p(3, 'sexual')], ['suwar', p(2)],

  // ── Hindi (Devanagari) ────────────────────────────────────
  ['चूतिया', p(3)], ['बहनचोद', p(4)], ['मादरचोद', p(4)],
  ['भोसड़ी', p(4)], ['भोसडीके', p(4)], ['गांडू', p(3)], ['गांड', p(3)],
  ['रंडी', p(3, 'sexual')], ['हरामी', p(2)], ['कमीना', p(2)],
  ['कुत्ता', p(2)], ['साला', p(1, 'mild')], ['लोडू', p(3)],
  ['लौड़ा', p(3, 'sexual')], ['भड़वा', p(3)], ['तत्ती', p(2)],
  ['हरामज़ादा', p(3)], ['बकचोद', p(3)], ['झाटू', p(2)],
  ['लंड', p(3, 'sexual')], ['सूअर', p(2)],

  // ── Tamil (romanized) ─────────────────────────────────────
  ['punda', p(3)], ['pundai', p(3)], ['pundek', p(3)],
  ['thevdiya', p(3, 'sexual')], ['thevadiya', p(3, 'sexual')],
  ['otha', p(3)], ['ottha', p(3)],
  ['baadu', p(2)], ['sunni', p(3, 'sexual')],
  ['koothi', p(3, 'sexual')], ['myiru', p(2)], ['myru', p(2)],
  ['thevidiya', p(3, 'sexual')], ['ommala', p(3)], ['okka', p(3)],
  ['loosu', p(1, 'mild')], ['kena', p(1, 'mild')],

  // ── Telugu (romanized) ────────────────────────────────────
  ['lanja', p(3, 'sexual')], ['lanjakodaka', p(4)],
  ['modda', p(3, 'sexual')], ['sulli', p(3, 'sexual')],
  ['dengu', p(3)], ['dengey', p(3)], ['gudda', p(2)],
  ['pooka', p(2)], ['donga', p(1, 'mild')], ['kukka', p(1, 'mild')],
  ['erri', p(1, 'mild')], ['puka', p(2)],

  // ── Bengali (romanized) ───────────────────────────────────
  ['banchod', p(4)], ['magi', p(3, 'sexual')],
  ['bokachoda', p(4)], ['boka', p(1, 'mild')],
  ['shala', p(1, 'mild')], ['chudir', p(3)],
  ['khankir', p(3)], ['haramjada', p(3)],
  ['nangta', p(2, 'sexual')], ['gudmarani', p(3)],

  // ── Kannada (romanized) ───────────────────────────────────
  ['sule', p(3, 'sexual')], ['sulemaaga', p(3, 'sexual')],
  ['bolli', p(3, 'sexual')], ['bolimaga', p(3)],
  ['tunne', p(3, 'sexual')], ['munde', p(2)],
  ['naayi', p(1, 'mild')], ['bevarsi', p(2)],

  // ── Malayalam (romanized) ─────────────────────────────────
  ['myiru', p(2)], ['thendi', p(2)], ['poori', p(3, 'sexual')],
  ['kunna', p(3, 'sexual')], ['poorimone', p(3)],
  ['kandatharam', p(2)], ['thayoli', p(4)],
  ['pattikku', p(2)], ['nayinte', p(2)],

  // ── Marathi (romanized) ───────────────────────────────────
  ['zavnya', p(3)], ['aaizhavadya', p(4)],
  ['bhikarchot', p(4)], ['randya', p(3, 'sexual')],
  ['chinal', p(3, 'sexual')], ['ghatya', p(1, 'mild')],
  ['shendi', p(2)],

  // ── Punjabi (romanized) ───────────────────────────────────
  ['penchod', p(4)], ['kutti', p(2, 'sexual')],
  ['khotey', p(1, 'mild')], ['tatti', p(2)],
  ['bhosru', p(3)], ['gandasa', p(2)],
  ['kanjar', p(3, 'sexual')],

  // ── Gujarati (romanized) ──────────────────────────────────
  ['ghelo', p(1, 'mild')], ['gadho', p(1, 'mild')],
  ['gando', p(2)], ['chutio', p(3)],
  ['bhosado', p(3)], ['raandi', p(3, 'sexual')],
]);

/** Multi-word phrases (normalized). Checked via substring/ngram. */
export const PROFANITY_PHRASES: Array<{ phrase: string; severity: 1 | 2 | 3 | 4 }> = [
  { phrase: 'teri maa ki', severity: 3 },
  { phrase: 'tera baap', severity: 2 },
  { phrase: 'maa chod', severity: 4 },
  { phrase: 'behen ki', severity: 3 },
  { phrase: 'gand mara', severity: 3 },
  { phrase: 'bhad me ja', severity: 2 },
  { phrase: 'bhen ke', severity: 3 },
  { phrase: 'maa ki aankh', severity: 2 },
  { phrase: 'chup kar', severity: 1 },
  { phrase: 'shut up', severity: 1 },
  { phrase: 'go to hell', severity: 2 },
  { phrase: 'son of', severity: 1 },
  { phrase: 'piece of shit', severity: 3 },
  { phrase: 'teri gaand', severity: 3 },
  { phrase: 'chutiye ka', severity: 3 },
  { phrase: 'tere muh me', severity: 3 },
  { phrase: 'lode lag gaye', severity: 3 },
  { phrase: 'land ka', severity: 3 },
  { phrase: 'jaa mar', severity: 2 },
  { phrase: 'nikal lavde', severity: 3 },
];

// ═══════════════════════════════════════════════════════════════
// SENTIMENT LEXICON  (AFINN-inspired, –5 … +5)
// Only high-impact entries; keeps bundle small.
// ═══════════════════════════════════════════════════════════════

export const SENTIMENT_MAP: Map<string, number> = new Map([
  // ── Strongly negative ──
  ['hate', -4], ['hated', -4], ['hatred', -4],
  ['terrible', -4], ['horrible', -4], ['disgusting', -4], ['awful', -4],
  ['worst', -4], ['pathetic', -3], ['miserable', -3], ['dreadful', -4],
  ['abysmal', -4], ['atrocious', -4], ['unbearable', -3],
  ['angry', -3], ['furious', -4], ['enraged', -4], ['livid', -4],
  ['outraged', -3], ['annoyed', -2], ['irritated', -2], ['frustrated', -2],
  ['upset', -2], ['disappointed', -2], ['unhappy', -2], ['sad', -2],
  ['depressed', -3], ['hopeless', -3], ['toxic', -3],
  ['useless', -3], ['worthless', -4], ['trash', -3], ['garbage', -3],
  ['rubbish', -3], ['rotten', -3], ['stale', -2], ['spoiled', -2],
  ['dirty', -2], ['filthy', -3], ['nasty', -3], ['gross', -2],
  ['cold', -1], ['bad', -2], ['poor', -2], ['worse', -3],
  ['sucks', -3], ['suck', -3], ['hate', -4],
  ['never', -1], ['no', -1], ['not', -1], ['dont', -1],
  ['cant', -1], ['wont', -1], ['nothing', -1],
  ['boring', -2], ['bland', -2], ['tasteless', -2],
  ['overpriced', -2], ['expensive', -1], ['waste', -2],
  ['unfair', -2], ['unjust', -3], ['ridiculous', -2],
  ['absurd', -2], ['laughable', -2], ['joke', -1],

  // ── Mildly negative ──
  ['mediocre', -1], ['average', 0], ['okay', 0], ['meh', -1],
  ['fine', 0], ['so-so', -1],

  // ── Positive ──
  ['good', 2], ['great', 3], ['excellent', 4], ['amazing', 4],
  ['wonderful', 4], ['fantastic', 4], ['awesome', 4], ['superb', 4],
  ['outstanding', 4], ['brilliant', 4], ['perfect', 5],
  ['love', 3], ['loved', 3], ['lovely', 3], ['beautiful', 3],
  ['delicious', 4], ['tasty', 3], ['yummy', 3], ['fresh', 2],
  ['clean', 2], ['nice', 2], ['pleasant', 2], ['comfortable', 2],
  ['happy', 3], ['glad', 2], ['satisfied', 2], ['pleased', 2],
  ['thankful', 3], ['grateful', 3], ['appreciate', 3],
  ['impressive', 3], ['remarkable', 3], ['helpful', 2],
  ['friendly', 2], ['polite', 2], ['kind', 2], ['caring', 2],
  ['improved', 2], ['better', 1], ['best', 4],
  ['recommend', 2], ['enjoy', 3], ['enjoyed', 3],
  ['thanks', 2], ['thank', 2], ['please', 1],

  // ── Hindi sentiment (romanized) ──
  ['bakwas', -3], ['ghatiya', -3], ['bekar', -2], ['wahiyat', -3],
  ['achha', 2], ['accha', 2], ['badhiya', 3], ['mast', 3],
  ['shandaar', 4], ['zabardast', 4], ['kamaal', 3],
  ['bura', -2], ['kharab', -2], ['thandha', -1], ['ganda', -2],
  ['saaf', 2], ['swadisht', 3], ['mazedaar', 3],
  ['bakwaas', -3], ['faltu', -2], ['chee', -2],
  ['thik', 0], ['theek', 0],
]);

// ═══════════════════════════════════════════════════════════════
// EMOTION LEXICON  (word → partial emotion vector, 0…1 each)
// Based on NRC-emotion-style categories.
// ═══════════════════════════════════════════════════════════════

type PartialEmotions = Partial<Emotions>;

const em = (e: PartialEmotions) => e;

export const EMOTION_MAP: Map<string, PartialEmotions> = new Map([
  // ── Anger ──
  ['angry', em({ anger: 0.9, disgust: 0.3 })],
  ['furious', em({ anger: 1, disgust: 0.3 })],
  ['enraged', em({ anger: 1, disgust: 0.4 })],
  ['livid', em({ anger: 1 })],
  ['outraged', em({ anger: 0.8, disgust: 0.4 })],
  ['annoyed', em({ anger: 0.5 })],
  ['irritated', em({ anger: 0.5 })],
  ['frustrated', em({ anger: 0.6, sadness: 0.3 })],
  ['hate', em({ anger: 0.9, disgust: 0.5 })],
  ['hatred', em({ anger: 1, disgust: 0.6 })],
  ['rage', em({ anger: 1 })],
  ['mad', em({ anger: 0.7 })],
  ['pissed', em({ anger: 0.7 })],
  ['infuriated', em({ anger: 0.9 })],

  // ── Disgust ──
  ['disgusting', em({ disgust: 1, anger: 0.3 })],
  ['disgusted', em({ disgust: 0.9 })],
  ['gross', em({ disgust: 0.7 })],
  ['filthy', em({ disgust: 0.8 })],
  ['nasty', em({ disgust: 0.7, anger: 0.2 })],
  ['revolting', em({ disgust: 1 })],
  ['vomit', em({ disgust: 0.9 })],
  ['puke', em({ disgust: 0.8 })],
  ['stink', em({ disgust: 0.6 })],
  ['cockroach', em({ disgust: 0.9, fear: 0.3 })],
  ['insect', em({ disgust: 0.5, fear: 0.3 })],
  ['worm', em({ disgust: 0.5 })],
  ['rot', em({ disgust: 0.6 })],
  ['rotten', em({ disgust: 0.7 })],
  ['mold', em({ disgust: 0.6 })],
  ['unhygienic', em({ disgust: 0.7 })],

  // ── Fear ──
  ['afraid', em({ fear: 0.8, sadness: 0.2 })],
  ['scared', em({ fear: 0.8 })],
  ['terrified', em({ fear: 1 })],
  ['worried', em({ fear: 0.5, sadness: 0.3 })],
  ['anxious', em({ fear: 0.6 })],
  ['unsafe', em({ fear: 0.7 })],
  ['danger', em({ fear: 0.7 })],
  ['threat', em({ fear: 0.6, anger: 0.3 })],

  // ── Sadness ──
  ['sad', em({ sadness: 0.8 })],
  ['depressed', em({ sadness: 1 })],
  ['hopeless', em({ sadness: 0.9, fear: 0.3 })],
  ['miserable', em({ sadness: 0.9 })],
  ['heartbroken', em({ sadness: 1 })],
  ['disappointed', em({ sadness: 0.6 })],
  ['unhappy', em({ sadness: 0.6 })],
  ['lonely', em({ sadness: 0.7 })],
  ['pathetic', em({ sadness: 0.5, disgust: 0.3 })],

  // ── Joy ──
  ['happy', em({ joy: 0.8 })],
  ['delighted', em({ joy: 0.9 })],
  ['joyful', em({ joy: 1 })],
  ['excited', em({ joy: 0.8, surprise: 0.4 })],
  ['thrilled', em({ joy: 0.9 })],
  ['grateful', em({ joy: 0.7 })],
  ['wonderful', em({ joy: 0.9 })],
  ['amazing', em({ joy: 0.8, surprise: 0.4 })],
  ['fantastic', em({ joy: 0.9 })],
  ['excellent', em({ joy: 0.8 })],
  ['love', em({ joy: 0.8 })],
  ['loved', em({ joy: 0.9 })],

  // ── Surprise ──
  ['surprised', em({ surprise: 0.8 })],
  ['shocked', em({ surprise: 0.9, fear: 0.3 })],
  ['astonished', em({ surprise: 0.9 })],
  ['unexpected', em({ surprise: 0.7 })],
  ['unbelievable', em({ surprise: 0.6, anger: 0.2 })],
  ['wtf', em({ surprise: 0.7, anger: 0.5 })],

  // ── Hindi emotion words (romanized) ──
  ['gussa', em({ anger: 0.8 })],
  ['nafrat', em({ anger: 0.9, disgust: 0.5 })],
  ['chidh', em({ anger: 0.5 })],
  ['ganda', em({ disgust: 0.7 })],
  ['ghin', em({ disgust: 0.8 })],
  ['darr', em({ fear: 0.7 })],
  ['dukh', em({ sadness: 0.7 })],
  ['udaas', em({ sadness: 0.6 })],
  ['khushi', em({ joy: 0.8 })],
  ['maza', em({ joy: 0.6 })],
  ['hairaan', em({ surprise: 0.7 })],
]);

// ═══════════════════════════════════════════════════════════════
// INTENSITY MODIFIERS / NEGATION / SOCIAL TONE
// ═══════════════════════════════════════════════════════════════

/** Multiplier for the adjacent sentiment word */
export const INTENSIFIERS: Map<string, number> = new Map([
  ['very', 1.5], ['really', 1.5], ['extremely', 2], ['incredibly', 2],
  ['absolutely', 2], ['totally', 1.5], ['completely', 1.8],
  ['super', 1.5], ['utterly', 2], ['quite', 1.2], ['pretty', 1.1],
  ['so', 1.4], ['too', 1.3], ['damn', 1.5], ['bloody', 1.5],
  ['fucking', 2], ['freaking', 1.3],
  ['bahut', 1.5], ['bohot', 1.5], ['ekdum', 2], ['bilkul', 1.8],
  ['khoob', 1.5], ['sachmuch', 1.5],
]);

/** Window-based negation (flips polarity of next word) */
export const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'neither', 'nor', 'none', 'nothing',
  'dont', 'doesnt', 'didnt', 'wont', 'cant', 'couldnt',
  'shouldnt', 'wouldnt', 'isnt', 'arent', 'wasnt', 'werent',
  'havent', 'hasnt', 'hadnt', 'hardly', 'barely', 'scarcely',
  'nahi', 'naa', 'na', 'mat', 'kabhi nahi', 'bilkul nahi',
]);

/** Politeness / hostility markers (tokens to look for) */
export const POLITENESS_MARKERS = new Set([
  'please', 'thanks', 'thank', 'sorry', 'appreciate',
  'kindly', 'request', 'requesting', 'respectfully',
  'kripya', 'dhanyawad', 'shukriya', 'maaf',
]);

export const HOSTILITY_MARKERS = new Set([
  'die', 'kill', 'burn', 'destroy', 'attack',
  'curse', 'punch', 'slap', 'beat', 'smash',
  'maro', 'maaro', 'jala', 'kaat', 'tod',
  'peet', 'ukhaad', 'phaad',
]);
