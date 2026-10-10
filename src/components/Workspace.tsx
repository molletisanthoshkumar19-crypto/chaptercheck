import { useState, useRef, Fragment, useCallback, useEffect } from "react";
import {
  Plus, Mic, MicOff, ArrowUp, FileText, X,
  ChevronDown, Maximize2, Loader2, AlertCircle,
} from "lucide-react";
import { useApp } from "../utils/AppContext";
import { readFile, MAX_CHARS } from "../utils/fileUpload";
import { useMicrophone } from "../utils/useMicrophone";
import { splitSentences } from "../utils/analysis";

// ---------------------------------------------------------------------------
// InputBar
// ---------------------------------------------------------------------------

export function InputBar() {
  const {
    text, setText, filename, setFilename,
    runAnalysis, analyseError, isAnalysing, clearFile,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");

  const handleTranscript = useCallback(
    (transcript: string) => {
      setText(text + (text.trim() ? " " : "") + transcript.trim());
    },
    [text, setText],
  );

  const { status: micStatus, error: micError, start: startMic, stop: stopMic } =
    useMicrophone(handleTranscript);

  const handleUploadClick = () => {
    setUploadError("");
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const result = await readFile(file);
    if (!result.ok) {
      setUploadError(result.error);
      return;
    }
    setText(result.text);
    setFilename(result.filename);
    setUploadError("");
  };

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;
  const hasContent = text.trim().length > 0;
  const hasFile = filename.length > 0;

  const handleSubmit = () => {
    if (isAnalysing || !hasContent || isOverLimit) return;
    runAnalysis();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  const displayError = uploadError || analyseError || micError;

  return (
    <div className="cc-input-wrap">
      {/* Hidden file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="cc-input">
        {/* Upload button */}
        <button
          className="cc-upload"
          aria-label="Upload file"
          onClick={handleUploadClick}
          disabled={isAnalysing}
          type="button"
        >
          <span className="cc-plus">
            <Plus size={20} strokeWidth={1.8} />
          </span>
          <span className="cc-upload-text">
            <strong>Upload file</strong>
            <small>TXT, DOCX</small>
          </span>
        </button>

        <span className="cc-vsep" />

        {/* Text area */}
        <textarea
          id="cc-text-input"
          ref={(el) => {
            if (el) {
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }
          }}
          className="cc-text cc-textarea"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste your chapter or ask with your voice…"
          rows={1}
          aria-label="Chapter text input"
        />

        {/* Mic button */}
        <button
          className={`cc-icon-btn${micStatus === "listening" ? " cc-mic-active" : ""}`}
          aria-label={micStatus === "listening" ? "Stop listening" : "Voice input"}
          onClick={micStatus === "listening" ? stopMic : startMic}
          disabled={micStatus === "unsupported" || micStatus === "denied"}
          title={
            micStatus === "unsupported"
              ? "Speech recognition is not supported by this browser"
              : micStatus === "denied"
              ? "Microphone permission denied — allow access in browser settings"
              : micStatus === "listening"
              ? "Click to stop listening"
              : "Start voice input"
          }
          type="button"
        >
          {micStatus === "listening"
            ? <MicOff size={18} strokeWidth={1.6} className="cc-mic-pulse" />
            : <Mic size={18} strokeWidth={1.6} />}
        </button>

        {/* Submit */}
        <button
          id="cc-analyze-btn"
          className="cc-submit"
          aria-label="Analyse"
          onClick={handleSubmit}
          disabled={isAnalysing || !hasContent || isOverLimit}
          type="button"
        >
          {isAnalysing
            ? <Loader2 size={16} className="cc-spin" />
            : <ArrowUp size={18} strokeWidth={2} />}
        </button>
      </div>

      {/* Meta row */}
      <div className="cc-input-meta">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {hasFile && (
            <span className="cc-chip">
              <FileText size={14} strokeWidth={1.6} />
              {filename}
              <X
                size={13}
                className="cc-chip-x"
                onClick={clearFile}
                role="button"
                aria-label="Remove file"
              />
            </span>
          )}

          {displayError && (
            <span className="cc-error-inline">
              <AlertCircle size={13} />
              {displayError}
            </span>
          )}

          {micStatus === "listening" && (
            <span className="cc-listening-badge">
              <span className="cc-pulse-dot" />
              Listening…
            </span>
          )}

          {micStatus === "unsupported" && (
            <span className="cc-muted" style={{ fontSize: 11.5 }}>
              Voice input not supported in this browser
            </span>
          )}
        </div>

        <span className={`cc-count${isOverLimit ? " cc-count-over" : ""}`}>
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChapterContent
// ---------------------------------------------------------------------------

export function ChapterContent() {
  const {
    text,
    analysis,
    selectedSentenceIndex,
    setSelectedSentenceIndex,
    setSelectedWord,
    chapterRef,
  } = useApp();

  const [zoom, setZoom] = useState(100);
  const sentenceEls = useRef<Map<number, HTMLElement>>(new Map());

  // Clear stale refs on each render so old DOM nodes don't linger
  sentenceEls.current.clear();

  // Scroll + flash animation when a sentence is selected from the sidebar
  useEffect(() => {
    if (selectedSentenceIndex === null) return;
    const el = sentenceEls.current.get(selectedSentenceIndex);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("cc-hl-flash");
    const t = setTimeout(() => el.classList.remove("cc-hl-flash"), 1400);
    return () => clearTimeout(t);
  }, [selectedSentenceIndex]);

  const hasText = text.trim().length > 0;
  const { sentences, difficultWords, isStale } = analysis;

  // Map sentence text → rank for O(1) lookup
  const rankedMap = new Map<string, number>();
  for (const s of sentences) rankedMap.set(s.text, s.rank ?? 0);

  // Set of difficult word keys
  const difficultSet = new Set(difficultWords.map((w) => w.word));

  if (!hasText) {
    return (
      <section className="cc-card cc-chapter">
        <ChapterHead zoom={zoom} setZoom={setZoom} isStale={isStale} />
        <div className="cc-passage cc-passage-empty" ref={chapterRef as React.RefObject<HTMLDivElement>}>
          <p className="cc-empty-msg">
            Paste your chapter text or upload a .txt / .docx file, then click{" "}
            <strong>Analyse</strong> to see results.
          </p>
        </div>
      </section>
    );
  }

  // Split text into visual paragraphs first
  const paragraphTexts = text.split(/\n\s*\n/);

  // Build a global sentence→index map from the full text
  const allSentences = splitSentences(text);
  const sentenceIndexMap = new Map<string, number>();
  allSentences.forEach((s, i) => sentenceIndexMap.set(s, i));

  return (
    <section className="cc-card cc-chapter">
      <ChapterHead zoom={zoom} setZoom={setZoom} isStale={isStale} />

      <div
        ref={chapterRef as React.RefObject<HTMLDivElement>}
        className="cc-passage"
        style={{ fontSize: `${(15 * zoom) / 100}px` }}
      >
        {paragraphTexts.map((paraText, pi) => {
          const paraSentences = splitSentences(paraText);

          if (paraSentences.length === 0) {
            return <p key={pi} aria-hidden />;
          }

          return (
            <p key={pi}>
              {paraSentences.map((sentText, si) => {
                const rank = rankedMap.get(sentText);
                const sentIdx = sentenceIndexMap.get(sentText) ?? -1;
                const isSelected = sentIdx === selectedSentenceIndex;

                const content = renderWords(sentText, difficultSet, (w) => setSelectedWord(w));

                const refCb = (el: HTMLElement | null) => {
                  if (el && sentIdx >= 0) sentenceEls.current.set(sentIdx, el);
                };

                const node = rank !== undefined ? (
                  <mark
                    key={si}
                    ref={refCb as (el: HTMLElement | null) => void}
                    className={`cc-hl${isSelected ? " cc-hl-selected" : ""}`}
                    onClick={() => setSelectedSentenceIndex(sentIdx)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="cc-marker" aria-hidden>{rank}</span>
                    {content}
                  </mark>
                ) : (
                  <span
                    key={si}
                    ref={refCb as (el: HTMLElement | null) => void}
                  >
                    {content}
                  </span>
                );

                return (
                  <Fragment key={si}>
                    {si > 0 ? " " : ""}
                    {node}
                  </Fragment>
                );
              })}
            </p>
          );
        })}
      </div>
    </section>
  );
}

// Splits sentence text into tokens and wraps difficult words in buttons
function renderWords(
  text: string,
  difficultSet: Set<string>,
  onWordClick: (word: string) => void,
): React.ReactNode[] {
  const tokens = text.split(/(\b[a-zA-Z'-]+\b)/);
  return tokens.map((token, i) => {
    if (!/^[a-zA-Z'-]+$/.test(token)) return <Fragment key={i}>{token}</Fragment>;
    const lower = token.toLowerCase().replace(/^['-]+|['-]+$/g, "");
    if (difficultSet.has(lower)) {
      return (
        <button
          key={i}
          className="cc-word"
          onClick={(e) => { e.stopPropagation(); onWordClick(lower); }}
          title={`Look up "${token}"`}
          aria-label={`Look up word: ${token}`}
          type="button"
        >
          {token}
        </button>
      );
    }
    return <Fragment key={i}>{token}</Fragment>;
  });
}

function ChapterHead({
  zoom, setZoom, isStale,
}: {
  zoom: number;
  setZoom: (z: number) => void;
  isStale: boolean;
}) {
  return (
    <div className="cc-card-head">
      <div className="cc-card-title">
        <FileText size={17} strokeWidth={1.6} />
        Chapter Content
        {isStale && (
          <span className="cc-stale-badge" title="Text changed since last analysis — click Analyse to refresh">
            outdated
          </span>
        )}
      </div>
      <div className="cc-card-tools">
        <label className="cc-zoom">
          <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
            {[75, 90, 100, 110, 125].map((z) => (
              <option key={z} value={z}>{z}%</option>
            ))}
          </select>
          <ChevronDown size={14} />
        </label>
        <button className="cc-icon-btn" aria-label="Expand" type="button">
          <Maximize2 size={15} strokeWidth={1.6} />
        </button>
      </div>
    </div>
  );
}
