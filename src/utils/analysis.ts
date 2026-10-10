/**
 * ChapterCheck — Local Analysis Engine (Part 2)
 *
 * All analysis runs entirely in the browser with no external AI service.
 * Weights and heuristics are documented inline and can be tuned freely.
 */

// ---------------------------------------------------------------------------
// 1. SYLLABLE COUNTING
// A rule-based heuristic for English. Not 100 % accurate but reliable enough
// for Flesch Reading Ease estimation.
// ---------------------------------------------------------------------------

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return w.length > 0 ? 1 : 0;
  
  let count = 0;
  const vowels = "aeiouy";
  let onVowel = false;
  
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !onVowel) {
      count++;
    }
    onVowel = isVowel;
  }
  
  // Handle trailing silent 'e'
  if (w.endsWith("e")) {
    count--;
    // Keep 'le' if preceded by a consonant (e.g. apple, table)
    if (w.endsWith("le") && w.length > 2 && !vowels.includes(w[w.length - 3])) {
      count++;
    }
  }
  
  // Handle '-ed' (waited/landed = keep; loved/jumped = subtract)
  if (w.endsWith("ed") && !w.endsWith("ted") && !w.endsWith("ded")) {
    count--;
  }
  
  // Handle '-es' (places/matches = keep; frames/shoes = subtract)
  if (
    w.endsWith("es") &&
    !w.endsWith("ces") &&
    !w.endsWith("ses") &&
    !w.endsWith("ges") &&
    !w.endsWith("zes") &&
    !w.endsWith("xes") &&
    !w.endsWith("ches") &&
    !w.endsWith("shes")
  ) {
    count--;
  }
  
  return Math.max(1, count);
}

// ---------------------------------------------------------------------------
// 2. BASIC TOKENISATION
// ---------------------------------------------------------------------------

export function countWords(text: string): number {
  return (text.match(/\b[a-zA-Z'-]+\b/g) || []).length;
}

export function extractWords(text: string): string[] {
  return (text.match(/\b[a-zA-Z'-]+\b/g) || []).map((w) => w.toLowerCase());
}

// ---------------------------------------------------------------------------
// 3. SENTENCE SPLITTING
// Handles common abbreviations, decimal numbers, ellipsis, etc.
// Returns an array of sentence strings in their original order.
// ---------------------------------------------------------------------------

const ABBREV = new Set([
  "mr","mrs","ms","dr","prof","sr","jr","vs","etc","e.g","i.e","fig",
  "approx","dept","est","govt","inc","ltd","st","ave","blvd","jan","feb",
  "mar","apr","jun","jul","aug","sep","oct","nov","dec","no","vol","pp",
  "ed","al","rev",
]);

export function splitSentences(text: string): string[] {
  const normalised = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const raw: string[] = [];
  let start = 0;
  const re = /([.!?]+)(\s+)(?=[A-Z"'"(])/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(normalised)) !== null) {
    const endPos = m.index + m[1].length;
    const preceding = normalised.slice(0, m.index);
    const lastWord = (preceding.match(/([a-zA-Z.]+)$/) || [""])[0].toLowerCase().replace(/\.$/, "");

    if (ABBREV.has(lastWord)) continue;
    if (/\d$/.test(preceding)) continue;

    const sentence = normalised.slice(start, endPos).trim();
    if (sentence.length > 0) raw.push(sentence);
    start = endPos + m[2].length;
  }

  const tail = normalised.slice(start).trim();
  if (tail.length > 0) raw.push(tail);

  return raw.filter((s) => s.replace(/\s+/g, "").length > 0);
}

// ---------------------------------------------------------------------------
// 4. FLESCH READING EASE
// ---------------------------------------------------------------------------

export type ReadabilityResult = {
  score: number;
  rawScore: number;
  label: string;
  description: string;
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  tooShort: boolean;
};

function getLabel(score: number): { label: string; description: string } {
  if (score >= 90) return {
    label: "Very Easy",
    description: "Very easy to read. Easily understood by an average 11-year-old student. This is an estimate of reading ease, not a direct measure of comprehension.",
  };
  if (score >= 80) return {
    label: "Easy",
    description: "Easy to read. Conversational English for consumers. This is an estimate of reading ease, not a direct measure of comprehension.",
  };
  if (score >= 70) return {
    label: "Fairly Easy",
    description: "Fairly easy to read. Suitable for most general audiences. This is an estimate of reading ease, not a direct measure of comprehension.",
  };
  if (score >= 60) return {
    label: "Standard",
    description: "Plain English. Easily understood by 13–15-year-old students. This is an estimate of reading ease, not a direct measure of comprehension.",
  };
  if (score >= 50) return {
    label: "Fairly Difficult",
    description: "Fairly difficult to read. Requires some effort from the reader. This is an estimate of reading ease, not a direct measure of comprehension.",
  };
  if (score >= 30) return {
    label: "Difficult",
    description: "Difficult to read. Best understood by college graduates. This is an estimate of reading ease, not a direct measure of comprehension.",
  };
  return {
    label: "Very Difficult",
    description: "Very difficult to read. Best understood by university graduates and specialists. This is an estimate of reading ease, not a direct measure of comprehension.",
  };
}

export function calculateReadability(text: string): ReadabilityResult {
  const words = extractWords(text);
  const wordCount = words.length;
  const sentences = splitSentences(text);
  const sentenceCount = sentences.length;

  if (wordCount < 10 || sentenceCount < 1) {
    return {
      score: 0,
      rawScore: 0,
      label: "Too Short",
      description: "The passage is too short for a reliable readability estimate. Please paste at least a full paragraph.",
      wordCount,
      sentenceCount,
      syllableCount: 0,
      tooShort: true,
    };
  }

  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const asl = wordCount / sentenceCount;
  const asw = syllableCount / wordCount;

  const rawScore = 206.835 - 1.015 * asl - 84.6 * asw;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  const { label, description } = getLabel(score);
  return { score, rawScore, label, description, wordCount, sentenceCount, syllableCount, tooShort: false };
}

// ---------------------------------------------------------------------------
// 5. SENTENCE DIFFICULTY SCORING
//
// Scores are computed on ABSOLUTE scales so that a simple passage
// does not artificially inflate its own sentences' scores by normalization.
//
// Signal contributions (all clamped to [0, 1] before weighting):
//   W_LEN     (0.35) — sentence word count (clamped at 40 words = max)
//   W_SYL     (0.30) — avg syllables/word  (clamped at 2.5 syl/word = max)
//   W_CLAUSE  (0.20) — clause-marker density (clamped at 4 markers = max)
//   W_UNCOMMON(0.15) — fraction of uncommon ≥3-syllable words
//
// MIN_DIFFICULTY_SCORE — the minimum composite score (0–100) a sentence
// must reach to appear in the Top 5 list.  Raise to make selection stricter;
// lower to surface more sentences.  30 was chosen so that a passage of
// short, simple sentences produces zero results.
// ---------------------------------------------------------------------------

/** Minimum score out of 100 a sentence needs to appear in the results. */
export const MIN_DIFFICULTY_SCORE = 30;

const CLAUSE_MARKERS = new Set([
  "although","because","since","unless","until","whereas","while","though",
  "whether","if","when","where","which","who","whom","whose","that","as",
  "after","before","once","rather","despite","however","moreover","furthermore",
  "nevertheless","consequently","therefore","thus","hence","accordingly","meanwhile",
]);

export const COMMON_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "by","from","is","was","are","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","must","shall",
  "it","its","this","that","these","those","he","she","they","we","i","you",
  "his","her","their","our","my","your","him","us","me","them","who",
  "what","which","how","when","where","why","not","so","as","if","up","out",
  "no","all","can","more","also","into","than","then","about","over","after",
  "just","some","any","only","new","very","even","most","such","here","there",
  "well","said","each","other","time","way","one","two","see","now","like",
  "go","come","know","get","make","take","year","day","man","men","people",
  "good","too","first","last","long","great","little","own","right","old",
  "big","high","different","small","large","next","early","young","important",
  "public","private","real","same","able","many","few","those","both","end",
  "put","use","used","using","need","part","place","back","life","give",
  "most","through","work","think","still","try","hand","world","point",
  "every","help","home","together","both","between","under","around",
  "never","always","often","again","something","nothing","everything",
]);

export type AnalysedSentence = {
  text: string;
  index: number;
  score: number;
  wordCount: number;
  avgSyllables: number;
  clauseCount: number;
  uncommonRatio: number;
  rank?: number;
};

export function analyseSentences(text: string): AnalysedSentence[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  // Absolute-scale ceilings used for normalization.
  // These represent "very hard" values — sentences at or above these ceilings
  // score 1.0 (100 %) for that signal.  Adjust here to tune sensitivity.
  const CEIL_WORDS   = 40;   // a 40-word sentence is considered maximally long
  const CEIL_SYL     = 2.5;  // 2.5 avg syllables/word = very polysyllabic
  const CEIL_CLAUSE  = 4;    // 4 clause-markers = very complex
  // uncommonRatio already in [0,1], no ceiling needed

  const W_LEN     = 0.35;
  const W_SYL     = 0.30;
  const W_CLAUSE  = 0.20;
  const W_UNCOMMON = 0.15;

  return sentences.map((sent, index) => {
    const words = extractWords(sent);
    const wordCount = words.length;

    if (wordCount === 0) {
      return { text: sent, index, score: 0, wordCount: 0, avgSyllables: 0, clauseCount: 0, uncommonRatio: 0 };
    }

    const syllables = words.map(countSyllables);
    const avgSyllables = syllables.reduce((a, b) => a + b, 0) / wordCount;
    const clauseCount = words.filter((w) => CLAUSE_MARKERS.has(w)).length;
    const uncommonCount = words.filter((w) => !COMMON_WORDS.has(w) && countSyllables(w) >= 3).length;
    const uncommonRatio = uncommonCount / wordCount;

    // Clamp each signal to [0, 1] against its absolute ceiling
    const nLen      = Math.min(wordCount / CEIL_WORDS, 1);
    const nSyl      = Math.min(avgSyllables / CEIL_SYL, 1);
    const nClause   = Math.min(clauseCount / CEIL_CLAUSE, 1);
    const nUncommon = Math.min(uncommonRatio, 1);

    const raw = W_LEN * nLen + W_SYL * nSyl + W_CLAUSE * nClause + W_UNCOMMON * nUncommon;
    const score = Math.round(raw * 100);

    return { text: sent, index, score, wordCount, avgSyllables, clauseCount, uncommonRatio };
  });
}

export type RankedSentence = AnalysedSentence & { rank: number };

/**
 * Returns up to 5 ranked sentences that score at or above MIN_DIFFICULTY_SCORE.
 * Returns fewer than 5 (possibly 0) if the passage does not contain that many
 * genuinely difficult sentences.  Never pads with low-scoring sentences.
 */
export function topFiveHardest(analysed: AnalysedSentence[]): RankedSentence[] {
  const sorted = [...analysed]
    .filter((s) => s.wordCount >= 4 && s.score >= MIN_DIFFICULTY_SCORE)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return sorted.slice(0, 5).map((s, i) => ({ ...s, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// 6. DIFFICULT WORD DETECTION
// ---------------------------------------------------------------------------

export type DifficultWord = {
  word: string;
  display: string;
  syllables: number;
};

export function detectDifficultWords(text: string): DifficultWord[] {
  const raw = text.match(/\b[a-zA-Z'-]+\b/g) || [];
  const seen = new Map<string, DifficultWord>();

  for (const token of raw) {
    const lower = token.toLowerCase();
    if (seen.has(lower)) continue;
    if (COMMON_WORDS.has(lower)) continue;
    if (lower.length < 7) continue;
    const syl = countSyllables(lower);
    if (syl < 3) continue;
    seen.set(lower, { word: lower, display: token, syllables: syl });
  }

  return Array.from(seen.values()).sort((a, b) => a.word.localeCompare(b.word));
}

// ---------------------------------------------------------------------------
// 7. DIFFICULTY REASON BUILDER
// ---------------------------------------------------------------------------

export function buildReason(s: AnalysedSentence): string {
  const parts: string[] = [];
  if (s.wordCount >= 30) parts.push("long sentence");
  else if (s.wordCount >= 20) parts.push("moderately long");
  if (s.avgSyllables >= 1.8) parts.push("complex vocabulary");
  if (s.clauseCount >= 3) parts.push("multiple clauses");
  else if (s.clauseCount >= 2) parts.push("subordinate clauses");
  if (s.uncommonRatio >= 0.15) parts.push("uncommon words");
  if (parts.length === 0) parts.push("combined complexity signals");
  return parts.join(" + ");
}

// ---------------------------------------------------------------------------
// 8. DIFFICULTY LEVEL LABEL
// ---------------------------------------------------------------------------

export function difficultyLevel(score: number): "Very Hard" | "Hard" | "Moderate" {
  if (score >= 70) return "Very Hard";
  if (score >= 45) return "Hard";
  return "Moderate";
}
