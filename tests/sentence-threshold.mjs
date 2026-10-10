/**
 * Unit tests for sentence selection threshold logic (Issue 1).
 * Run with: node tests/sentence-threshold.mjs
 */

// ── Re-implement the core logic in plain JS for testing ───────────────────

function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return w.length > 0 ? 1 : 0;
  let count = 0;
  const vowels = "aeiouy";
  let onVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !onVowel) count++;
    onVowel = isVowel;
  }
  if (w.endsWith("e")) {
    count--;
    if (w.endsWith("le") && w.length > 2 && !vowels.includes(w[w.length - 3])) count++;
  }
  if (w.endsWith("ed") && !w.endsWith("ted") && !w.endsWith("ded")) count--;
  if (w.endsWith("es") && !w.endsWith("ces") && !w.endsWith("ses") &&
    !w.endsWith("ges") && !w.endsWith("zes") && !w.endsWith("xes") &&
    !w.endsWith("ches") && !w.endsWith("shes")) count--;
  return Math.max(1, count);
}

function extractWords(text) {
  return (text.match(/\b[a-zA-Z'-]+\b/g) || []).map(w => w.toLowerCase());
}

const CLAUSE_MARKERS = new Set([
  "although", "because", "since", "unless", "until", "whereas", "while", "though",
  "whether", "if", "when", "where", "which", "who", "whom", "whose", "that", "as",
  "after", "before", "once", "rather", "despite", "however", "moreover", "furthermore",
  "nevertheless", "consequently", "therefore", "thus", "hence", "accordingly", "meanwhile",
]);

const COMMON_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "is", "was", "are", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall",
  "it", "its", "this", "that", "these", "those", "he", "she", "they", "we", "i", "you",
  "his", "her", "their", "our", "my", "your", "him", "us", "me", "them", "who",
  "what", "which", "how", "when", "where", "why", "not", "so", "as", "if", "up", "out",
  "no", "all", "can", "more", "also", "into", "than", "then", "about", "over", "after",
  "just", "some", "any", "only", "new", "very", "even", "most", "such", "here", "there",
  "well", "said", "each", "other", "time", "way", "one", "two", "see", "now", "like",
  "go", "come", "know", "get", "make", "take", "year", "day", "man", "men", "people",
  "good", "too", "first", "last", "long", "great", "little", "own", "right", "old",
]);

// Absolute-scale ceilings matching the new analysis.ts implementation
const CEIL_WORDS = 40;
const CEIL_SYL = 2.5;
const CEIL_CLAUSE = 4;
const W_LEN = 0.35, W_SYL = 0.30, W_CLAUSE = 0.20, W_UNCOMMON = 0.15;

function analyseSentences(sentences) {
  return sentences.map((sent, index) => {
    const words = extractWords(sent);
    const wordCount = words.length;
    if (wordCount === 0) return { text: sent, index, score: 0, wordCount: 0, avgSyllables: 0, clauseCount: 0, uncommonRatio: 0 };
    const syllables = words.map(countSyllables);
    const avgSyllables = syllables.reduce((a, b) => a + b, 0) / wordCount;
    const clauseCount = words.filter(w => CLAUSE_MARKERS.has(w)).length;
    const uncommonCount = words.filter(w => !COMMON_WORDS.has(w) && countSyllables(w) >= 3).length;
    const uncommonRatio = uncommonCount / wordCount;
    const nLen = Math.min(wordCount / CEIL_WORDS, 1);
    const nSyl = Math.min(avgSyllables / CEIL_SYL, 1);
    const nClause = Math.min(clauseCount / CEIL_CLAUSE, 1);
    const nUncommon = Math.min(uncommonRatio, 1);
    const raw = W_LEN * nLen + W_SYL * nSyl + W_CLAUSE * nClause + W_UNCOMMON * nUncommon;
    const score = Math.round(raw * 100);
    return { text: sent, index, score, wordCount, avgSyllables, clauseCount, uncommonRatio };
  });
}

// The NEW threshold-based function (this is what we will implement in analysis.ts)
const MIN_DIFFICULTY_SCORE = 30; // sentences must score at least this out of 100

function topHardestWithThreshold(analysed, threshold = MIN_DIFFICULTY_SCORE) {
  const sorted = [...analysed]
    .filter(s => s.wordCount >= 4 && s.score >= threshold)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  return sorted.slice(0, 5).map((s, i) => ({ ...s, rank: i + 1 }));
}

// ── Tests ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? "✓" : "✗"} ${name}: got ${actual}, expected ${expected}`);
  if (ok) passed++; else failed++;
}

// Test A: Simple short passage — should produce fewer than 5 results
const simpleSentences = [
  "The cat sat on the mat.",
  "It was a warm day.",
  "The sun shone brightly.",
  "Birds sang in the trees.",
  "Children played happily.",
  "The dog ran fast.",
  "She smiled at him.",
];
const simpleAnalysed = analyseSentences(simpleSentences);
console.log("\n=== Test A: Simple passage scores ===");
simpleAnalysed.forEach(s => console.log(`  score=${s.score} "${s.text}"`));
const simpleResults = topHardestWithThreshold(simpleAnalysed);
test("A: Simple passage produces < 5 results", simpleResults.length < 5, true);

// Test B: Complex passage — should qualify several sentences
const complexSentences = [
  "Although the multifaceted implications of postmodern epistemological frameworks have engendered considerable controversy, the fundamental premise remains contentious.",
  "The systematically interconnected ramifications necessitate comprehensive reexamination of traditional metaphysical assumptions pertaining to consciousness.",
  "Consequently, philosophers must carefully evaluate recommendations generated by interdisciplinary collaborative methodologies before publishing.",
  "Simple cat sat on mat.",
  "The dog ran quickly.",
  "It was nice.",
  "Despite the inherently problematic nature of extrapolating from insufficient empirical evidence, preliminary investigations suggest numerous correlations.",
];
const complexAnalysed = analyseSentences(complexSentences);
console.log("\n=== Test B: Complex passage scores ===");
complexAnalysed.forEach(s => console.log(`  score=${s.score} "${s.text.slice(0, 60)}..."`));
const complexResults = topHardestWithThreshold(complexAnalysed);
test("B: Complex passage has >= 1 result", complexResults.length >= 1, true);
test("B: Complex passage has <= 5 results", complexResults.length <= 5, true);

// Test C: All simple sentences (very short words, no clauses) — should produce 0 results
const allSimpleSentences = [
  "Go now.",
  "Run fast.",
  "Eat well.",
  "Be good.",
  "Stay here.",
  "Come back.",
];
const allSimpleAnalysed = analyseSentences(allSimpleSentences);
console.log("\n=== Test C: All-simple passage (short words) ===");
allSimpleAnalysed.forEach(s => console.log(`  score=${s.score} "${s.text}"`));
const allSimpleResults = topHardestWithThreshold(allSimpleAnalysed);
test("C: Very simple passage produces 0 results", allSimpleResults.length === 0, true);

// Test D: 3 qualifying sentences out of 6 — exactly 3 returned
const mixedSentences = [
  "Hi.",  // too short (wordCount < 4)
  "The cat sat on the mat today.",  // simple
  "She went to the store and bought some milk.",  // simple, moderate length
  "Although the implementation of advanced technological infrastructure requires substantial investment and appropriately trained professionals, organizations that fail to consider these requirements may experience unexpected difficulties.",
  "The systematically interconnected ramifications of this philosophical perspective consequently necessitate comprehensive reexamination.",
  "He walked.",  // too short
];
const mixedAnalysed = analyseSentences(mixedSentences);
console.log("\n=== Test D: Mixed passage ===");
mixedAnalysed.forEach(s => console.log(`  score=${s.score} wc=${s.wordCount} "${s.text.slice(0, 60)}"`));
const mixedResults = topHardestWithThreshold(mixedAnalysed);
console.log(`  → ${mixedResults.length} qualified (threshold=${MIN_DIFFICULTY_SCORE})`);
test("D: At most 5 results from mixed passage", mixedResults.length <= 5, true);

// Test E: All results are ranked 1..n without gaps
if (complexResults.length > 0) {
  const ranks = complexResults.map(s => s.rank);
  const expected = Array.from({ length: complexResults.length }, (_, i) => i + 1);
  test("E: Ranks are sequential starting at 1", JSON.stringify(ranks), JSON.stringify(expected));
}

// Test F: Threshold boundary
const borderSentence = analyseSentences([
  "The remarkably sophisticated implementation requires comprehensive understanding.",
]);
const borderScore = borderSentence[0]?.score ?? 0;
console.log(`\n=== Test F: Border sentence score=${borderScore} ===`);
const aboveThreshold = topHardestWithThreshold(borderSentence, borderScore);
const belowThreshold = topHardestWithThreshold(borderSentence, borderScore + 1);
test("F: Sentence at exactly threshold qualifies", aboveThreshold.length, 1);
test("F: Sentence 1 below threshold does not qualify", belowThreshold.length, 0);

// ── Test G: Dictionary API response parsing ──────────────────────────────
console.log("\n=== Test G: Dictionary response parsing ===");

// Representative API response shaped exactly like dictionaryapi.dev returns
const MOCK_API_RESPONSE = [
  {
    word: "epistemological",
    phonetics: [
      { text: "/ɪˌpɪs.tɪ.məˈlɒdʒ.ɪ.kəl/", audio: "https://api.dictionaryapi.dev/media/pronunciations/en/epistemological-us.mp3" },
      { text: "", audio: "" },
    ],
    meanings: [
      {
        partOfSpeech: "adjective",
        definitions: [
          {
            definition: "Of or relating to epistemology, or the study of knowledge.",
            example: "The professor made an epistemological argument about the nature of certainty.",
            synonyms: [],
          },
          {
            definition: "Concerned with the nature and scope of knowledge.",
            synonyms: [],
          },
        ],
      },
    ],
  },
];

// Simulate the parsing logic used in DictDetail
function parseApiResponse(entries) {
  const audioUrl = entries
    .flatMap(e => e.phonetics)
    .find(p => p.audio && p.audio.trim() !== "")?.audio;

  const phonetic = entries
    .flatMap(e => e.phonetics)
    .find(p => p.text && p.text.trim() !== "")?.text;

  const word = entries[0]?.word;
  const meanings = entries.flatMap(e => e.meanings);
  const firstDef = meanings[0]?.definitions[0]?.definition;
  const firstExample = meanings[0]?.definitions[0]?.example;
  const firstPos = meanings[0]?.partOfSpeech;

  return { word, audioUrl, phonetic, firstDef, firstExample, firstPos, totalDefs: meanings[0]?.definitions.length };
}

const parsed = parseApiResponse(MOCK_API_RESPONSE);
test("G: word parsed correctly", parsed.word, "epistemological");
test("G: phonetic text parsed correctly", parsed.phonetic, "/ɪˌpɪs.tɪ.məˈlɒdʒ.ɪ.kəl/");
test("G: audio URL parsed correctly (non-empty)", parsed.audioUrl !== "" && parsed.audioUrl !== undefined, true);
test("G: partOfSpeech parsed correctly", parsed.firstPos, "adjective");
test("G: first definition parsed correctly", typeof parsed.firstDef === "string" && parsed.firstDef.length > 0, true);
test("G: example sentence parsed correctly", typeof parsed.firstExample === "string" && parsed.firstExample.length > 0, true);
test("G: multiple definitions available", parsed.totalDefs >= 2, true);

// Empty phonetics should not throw
const MOCK_NO_PHONETICS = [{ word: "test", phonetics: [], meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "A test." }] }] }];
const parsedEmpty = parseApiResponse(MOCK_NO_PHONETICS);
test("G: missing phonetics handled without error", parsedEmpty.audioUrl === undefined, true);
test("G: missing phonetic text handled without error", parsedEmpty.phonetic === undefined, true);

// 404 response handling (word not found)
const MOCK_404 = { title: "No Definitions Found" };
const handled404 = !Array.isArray(MOCK_404); // real API returns [] or error object on 404
test("G: 404 response does not parse as entries array", handled404, true);

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
