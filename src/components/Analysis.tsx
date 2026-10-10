import { useEffect, useRef } from "react";
import {
  BarChart3, Info, ChevronRight, Sparkles,
  Volume2, Loader2, AlertCircle,
} from "lucide-react";
import { useApp } from "../utils/AppContext";
import { useDictionary, type DictEntry } from "../utils/useDictionary";

// ---------------------------------------------------------------------------
// Ring SVG
// ---------------------------------------------------------------------------

function Ring({ value, tooShort }: { value: number; tooShort: boolean }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg width="86" height="86" viewBox="0 0 86 86" className="cc-ring">
      <circle cx="43" cy="43" r={r} stroke="#2e2e31" strokeWidth="7" fill="none" />
      {!tooShort && (
        <circle
          cx="43" cy="43" r={r}
          stroke="#d9b45a" strokeWidth="7" fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          transform="rotate(-90 43 43)"
        />
      )}
      <text x="43" y="48" textAnchor="middle" fill="#ededed" fontSize="13" fontWeight="600">
        {tooShort ? "—" : `${value}%`}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Readability Score Card
// ---------------------------------------------------------------------------

export function ReadabilityScoreCard() {
  const { analysis, isAnalysing } = useApp();
  const { readability } = analysis;

  if (isAnalysing) {
    return (
      <section className="cc-card cc-a-card">
        <div className="cc-a-head"><h3>Readability Score <Info size={13} className="cc-muted" /></h3></div>
        <div className="cc-loading-row"><Loader2 size={18} className="cc-spin cc-muted" /> <span className="cc-muted" style={{ fontSize: 13 }}>Calculating…</span></div>
      </section>
    );
  }

  if (!readability) {
    return (
      <section className="cc-card cc-a-card">
        <div className="cc-a-head"><h3>Readability Score <Info size={13} className="cc-muted" /></h3></div>
        <p className="cc-desc cc-muted-center">Analyse your text to see its Flesch Reading Ease score.</p>
      </section>
    );
  }

  const badgeClass = readability.tooShort ? "cc-badge-amber" : scoreToBadge(readability.score);

  return (
    <section className="cc-card cc-a-card">
      <div className="cc-a-head">
        <h3>Readability Score <Info size={13} className="cc-muted" /></h3>
      </div>
      <div className="cc-score-row">
        <div>
          <div className="cc-score">
            {readability.tooShort ? "—" : readability.score}
            <span> / 100</span>
          </div>
          <span className={`cc-badge ${badgeClass}`}>{readability.label}</span>
        </div>
        <Ring value={readability.tooShort ? 0 : readability.score} tooShort={readability.tooShort} />
      </div>
      <p className="cc-desc">{readability.description}</p>
      {!readability.tooShort && (
        <p className="cc-desc cc-muted" style={{ marginTop: 4 }}>
          {readability.wordCount.toLocaleString()} words · {readability.sentenceCount} sentences · {readability.syllableCount.toLocaleString()} syllables
        </p>
      )}
    </section>
  );
}

function scoreToBadge(score: number): string {
  if (score >= 70) return "cc-badge-green";
  if (score >= 50) return "cc-badge-amber";
  return "cc-badge-red";
}

// ---------------------------------------------------------------------------
// Hardest Sentences Card
// ---------------------------------------------------------------------------

const levelClass: Record<string, string> = {
  "Very Hard": "vh",
  "Hard": "h",
  "Moderate": "m",
};

export function HardestSentencesCard() {
  const { analysis, isAnalysing, setSelectedSentenceIndex, selectedSentenceIndex } = useApp();
  const { sentences, isStale } = analysis;

  if (isAnalysing) {
    return (
      <section className="cc-card cc-a-card">
        <div className="cc-a-head"><h3>Top 5 Hardest Sentences</h3></div>
        <div className="cc-loading-row"><Loader2 size={18} className="cc-spin cc-muted" /> <span className="cc-muted" style={{ fontSize: 13 }}>Analysing sentences…</span></div>
      </section>
    );
  }

  if (sentences.length === 0) {
    const { readability } = analysis;
    const hasRun = readability !== null;
    return (
      <section className="cc-card cc-a-card">
        <div className="cc-a-head"><h3>Top 5 Hardest Sentences</h3></div>
        <p className="cc-desc cc-muted-center">
          {isStale
            ? "Results are outdated — click Analyse to refresh."
            : hasRun
            ? "No particularly difficult sentences found. Your text appears relatively easy to read."
            : "Analyse your text to find the hardest sentences."}
        </p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-a-card">
      <div className="cc-a-head">
        <h3>Top 5 Hardest Sentences</h3>
        {isStale && <span className="cc-stale-badge">outdated</span>}
      </div>
      <ul className="cc-list">
        {sentences.map((s) => {
          const isSelected = s.index === selectedSentenceIndex;
          return (
            <li
              key={s.rank}
              className={`cc-row${isSelected ? " cc-row-active" : ""}`}
              onClick={() => setSelectedSentenceIndex(s.index === selectedSentenceIndex ? null : s.index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedSentenceIndex(s.index)}
              aria-pressed={isSelected}
            >
              <span className="cc-num">{s.rank}</span>
              <div className="cc-row-body">
                <p className="cc-row-title">{s.preview}</p>
                <p className="cc-row-sub">{s.reason}</p>
              </div>
              <span className={`cc-badge cc-lvl-${levelClass[s.level] ?? "m"}`}>{s.level}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Difficult Words Card
// ---------------------------------------------------------------------------

export function DifficultWordsCard() {
  const { analysis, isAnalysing, selectedWord, setSelectedWord } = useApp();
  const { difficultWords, isStale } = analysis;
  const { result, lookup } = useDictionary();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Trigger dictionary lookup when a word is selected
  useEffect(() => {
    if (selectedWord) lookup(selectedWord);
  }, [selectedWord, lookup]);

  if (isAnalysing) {
    return (
      <section className="cc-card cc-a-card">
        <div className="cc-a-head"><h3>Difficult Words</h3></div>
        <div className="cc-loading-row"><Loader2 size={18} className="cc-spin cc-muted" /></div>
      </section>
    );
  }

  if (difficultWords.length === 0) {
    return (
      <section className="cc-card cc-a-card">
        <div className="cc-a-head"><h3>Difficult Words</h3></div>
        <p className="cc-desc cc-muted-center">
          {isStale
            ? "Results are outdated — click Analyse to refresh."
            : "Analyse your text to detect potentially difficult vocabulary."}
        </p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-a-card">
      <div className="cc-a-head">
        <h3>Difficult Words</h3>
        {isStale && <span className="cc-stale-badge">outdated</span>}
      </div>

      {/* Word list */}
      <ul className="cc-list">
        {difficultWords.map((w) => {
          const isActive = w.word === selectedWord;
          return (
            <li
              key={w.word}
              className={`cc-row${isActive ? " cc-row-active" : ""}`}
              onClick={() => setSelectedWord(isActive ? "" : w.word)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedWord(isActive ? "" : w.word)}
            >
              <span className="cc-dot" />
              <div className="cc-row-body">
                <p className="cc-row-title">
                  <strong>{w.display}</strong>
                  <em className="cc-pos"> · {w.syllables} syl.</em>
                </p>
              </div>
              <ChevronRight size={15} className="cc-muted" />
            </li>
          );
        })}
      </ul>

      {/* Dictionary detail panel — only shown when a word is actively selected */}
      {selectedWord && (
        <div className="cc-dict-panel">
          {result.status === "loading" && (
            <div className="cc-loading-row">
              <Loader2 size={15} className="cc-spin cc-muted" />
              <span className="cc-muted" style={{ fontSize: 12 }}>Looking up "{selectedWord}"…</span>
            </div>
          )}
          {result.status === "not_found" && result.word === selectedWord && (
            <div className="cc-dict-not-found">
              <AlertCircle size={13} className="cc-muted" />
              <span>No definition found for "{selectedWord}".</span>
            </div>
          )}
          {result.status === "error" && result.word === selectedWord && (
            <div className="cc-dict-not-found">
              <AlertCircle size={13} className="cc-muted" />
              <span>Dictionary unavailable — {result.message}. Click the word again to retry.</span>
            </div>
          )}
          {result.status === "found" && result.word === selectedWord && (
            <DictDetail entries={result.entries} audioRef={audioRef} />
          )}
        </div>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: "none" }} />
    </section>
  );
}

function DictDetail({
  entries,
  audioRef,
}: {
  entries: DictEntry[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  // Find the first valid audio URL safely (API may omit phonetics)
  const audioUrl = entries
    .flatMap((e) => e.phonetics || [])
    .find((p) => p && p.audio && p.audio.trim() !== "")?.audio;

  // Find pronunciation text safely
  const phonetic = entries
    .flatMap((e) => e.phonetics || [])
    .find((p) => p && p.text && p.text.trim() !== "")?.text;

  const playAudio = () => {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current.src = audioUrl;
    audioRef.current.play().catch(() => {});
  };

  return (
    <div className="cc-dict-content">
      <div className="cc-dict-header">
        <span className="cc-dict-word">{entries[0]?.word}</span>
        {phonetic && <span className="cc-dict-phonetic">{phonetic}</span>}
        {audioUrl && (
          <button
            className="cc-icon-btn cc-dict-audio"
            onClick={playAudio}
            aria-label="Play pronunciation"
            title="Play pronunciation"
            type="button"
          >
            <Volume2 size={14} strokeWidth={1.6} />
          </button>
        )}
      </div>

      {entries.flatMap((entry) =>
        (entry.meanings || []).map((meaning, mi) => (
          <div key={`${entry.word}-${mi}`} className="cc-dict-meaning">
            <span className="cc-dict-pos">{meaning.partOfSpeech}</span>
            {(meaning.definitions || []).slice(0, 3).map((def, di) => (
              <div key={di} className="cc-dict-def">
                <p className="cc-dict-def-text">{def.definition}</p>
                {def.example && (
                  <p className="cc-dict-example">"{def.example}"</p>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnalysisPanel
// ---------------------------------------------------------------------------

export function AnalysisPanel() {
  const { runAnalysis, isAnalysing, analysis } = useApp();
  const hasResults = analysis.readability !== null;

  return (
    <aside className="cc-analysis">
      <div className="cc-analysis-head">
        <h2><BarChart3 size={17} strokeWidth={1.6} /> Analysis Results</h2>
        <button
          id="cc-analyze-sidebar-btn"
          className={`cc-analyze${isAnalysing ? " cc-analyze-loading" : ""}`}
          onClick={runAnalysis}
          disabled={isAnalysing}
          type="button"
          aria-label="Run analysis"
        >
          {isAnalysing
            ? <><Loader2 size={14} className="cc-spin" /> Analysing…</>
            : <><Sparkles size={14} /> {hasResults ? "Re-analyse" : "Analyse"}</>}
        </button>
      </div>
      <div className="cc-analysis-scroll">
        <ReadabilityScoreCard />
        <HardestSentencesCard />
        <DifficultWordsCard />
      </div>
    </aside>
  );
}
