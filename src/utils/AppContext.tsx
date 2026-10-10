// /**
//  * ChapterCheck — Shared application state context
//  * Holds all state produced by the analysis pipeline so that
//  * Workspace, InputBar, and AnalysisPanel stay synchronized.
//  */
// import React, { createContext, useContext, useState, useCallback, useRef } from "react";
// import {
//   calculateReadability,
//   analyseSentences,
//   topFiveHardest,
//   detectDifficultWords,
//   buildReason,
//   difficultyLevel,
//   type ReadabilityResult,
//   type RankedSentence,
//   type DifficultWord,
// } from "../utils/analysis";

// // ---------------------------------------------------------------------------
// // Types
// // ---------------------------------------------------------------------------

// export type SentenceResult = RankedSentence & {
//   level: "Very Hard" | "Hard" | "Moderate";
//   reason: string;
//   preview: string;
// };

// export type AppAnalysis = {
//   readability: ReadabilityResult | null;
//   sentences: SentenceResult[];
//   difficultWords: DifficultWord[];
//   isStale: boolean;      // true when text changed after last analysis
// };

// export type AppCtx = {
//   text: string;
//   setText: (t: string) => void;
//   filename: string;
//   setFilename: (f: string) => void;
//   analysis: AppAnalysis;
//   isAnalysing: boolean;
//   analyseError: string;
//   runAnalysis: () => void;
//   clearFile: () => void;
//   selectedWord: string;
//   setSelectedWord: (w: string) => void;
//   selectedSentenceIndex: number | null;
//   setSelectedSentenceIndex: (i: number | null) => void;
//   chapterRef: React.RefObject<HTMLDivElement | null>;
// };

// // ---------------------------------------------------------------------------
// // Context
// // ---------------------------------------------------------------------------

// const Ctx = createContext<AppCtx | null>(null);

// export function AppProvider({ children }: { children: React.ReactNode }) {
//   const [text, setTextRaw] = useState("");
//   const [filename, setFilename] = useState("");
//   const [analysis, setAnalysis] = useState<AppAnalysis>({
//     readability: null,
//     sentences: [],
//     difficultWords: [],
//     isStale: false,
//   });
//   const [isAnalysing, setIsAnalysing] = useState(false);
//   const [analyseError, setAnalyseError] = useState("");
//   const [selectedWord, setSelectedWord] = useState("");
//   const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
//   const chapterRef = useRef<HTMLDivElement | null>(null);

//   const setText = useCallback((t: string) => {
//     setTextRaw(t);
//     // Mark results stale when text changes after an analysis
//     setAnalysis((prev) =>
//       prev.readability !== null ? { ...prev, isStale: true } : prev
//     );
//   }, []);

//   const clearFile = useCallback(() => {
//     setFilename("");
//     setTextRaw("");
//     setAnalysis({ readability: null, sentences: [], difficultWords: [], isStale: false });
//     setAnalyseError("");
//     setSelectedWord("");
//     setSelectedSentenceIndex(null);
//   }, []);

//   const runAnalysis = useCallback(() => {
//     const trimmed = text.trim();
//     if (!trimmed) {
//       setAnalyseError("Please paste or type some text before analysing.");
//       return;
//     }
//     if (trimmed.split(/\s+/).length < 5) {
//       setAnalyseError("The text is too short. Please provide at least a full sentence.");
//       return;
//     }

//     setAnalyseError("");
//     setIsAnalysing(true);
//     setSelectedWord("");
//     setSelectedSentenceIndex(null);

//     // Defer to next task so React renders the loading state before CPU-bound work
//     setTimeout(() => {
//       try {
//         const readability = calculateReadability(trimmed);
//         const analysed = analyseSentences(trimmed);
//         const top5 = topFiveHardest(analysed);

//         const sentences: SentenceResult[] = top5.map((s) => ({
//           ...s,
//           level: difficultyLevel(s.score),
//           reason: buildReason(s),
//           preview: s.text.length > 80 ? s.text.slice(0, 77) + "…" : s.text,
//         }));

//         const difficultWords = detectDifficultWords(trimmed);

//         setAnalysis({ readability, sentences, difficultWords, isStale: false });
//       } catch (err) {
//         setAnalyseError("An unexpected error occurred during analysis. Please try again.");
//         console.error(err);
//       } finally {
//         setIsAnalysing(false);
//       }
//     }, 0);
//   }, [text]);

//   const value: AppCtx = {
//     text,
//     setText,
//     filename,
//     setFilename,
//     analysis,
//     isAnalysing,
//     analyseError,
//     runAnalysis,
//     clearFile,
//     selectedWord,
//     setSelectedWord,
//     selectedSentenceIndex,
//     setSelectedSentenceIndex,
//     chapterRef,
//   };

//   return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
// }

// export function useApp(): AppCtx {
//   const ctx = useContext(Ctx);
//   if (!ctx) throw new Error("useApp must be used inside AppProvider");
//   return ctx;
// }
/**
 * ChapterCheck — Shared application state context
 * Holds all state produced by the analysis pipeline so that
 * Workspace, InputBar, AnalysisPanel and History stay synchronized.
 */
import React, {
  createContext, useContext, useState, useCallback, useRef, useEffect,
} from "react";
import {
  calculateReadability,
  analyseSentences,
  topFiveHardest,
  detectDifficultWords,
  buildReason,
  difficultyLevel,
  type ReadabilityResult,
  type RankedSentence,
  type DifficultWord,
} from "../utils/analysis";
import {
  loadHistory, saveHistory, makeId, MAX_HISTORY, type HistoryEntry,
} from "./history";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SentenceResult = RankedSentence & {
  level: "Very Hard" | "Hard" | "Moderate";
  reason: string;
  preview: string;
};

export type AppAnalysis = {
  readability: ReadabilityResult | null;
  sentences: SentenceResult[];
  difficultWords: DifficultWord[];
  isStale: boolean;
};

export type AppCtx = {
  text: string;
  setText: (t: string) => void;
  filename: string;
  setFilename: (f: string) => void;
  analysis: AppAnalysis;
  isAnalysing: boolean;
  analyseError: string;
  runAnalysis: () => void;
  clearFile: () => void;
  selectedWord: string;
  setSelectedWord: (w: string) => void;
  selectedSentenceIndex: number | null;
  setSelectedSentenceIndex: (i: number | null) => void;
  chapterRef: React.RefObject<HTMLDivElement | null>;
  // History
  history: HistoryEntry[];
  openHistoryEntry: (id: string) => void;
  deleteHistoryEntry: (id: string) => void;
  clearHistory: () => void;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [text, setTextRaw] = useState("");
  const [filename, setFilename] = useState("");
  const [analysis, setAnalysis] = useState<AppAnalysis>({
    readability: null,
    sentences: [],
    difficultWords: [],
    isStale: false,
  });
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analyseError, setAnalyseError] = useState("");
  const [selectedWord, setSelectedWord] = useState("");
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const chapterRef = useRef<HTMLDivElement | null>(null);

  // Persist history whenever it changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const setText = useCallback((t: string) => {
    setTextRaw(t);
    setAnalysis((prev) =>
      prev.readability !== null ? { ...prev, isStale: true } : prev
    );
  }, []);

  const clearFile = useCallback(() => {
    setFilename("");
    setTextRaw("");
    setAnalysis({ readability: null, sentences: [], difficultWords: [], isStale: false });
    setAnalyseError("");
    setSelectedWord("");
    setSelectedSentenceIndex(null);
  }, []);

  const runAnalysis = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      setAnalyseError("Please paste or type some text before analysing.");
      return;
    }
    if (trimmed.split(/\s+/).length < 5) {
      setAnalyseError("The text is too short. Please provide at least a full sentence.");
      return;
    }

    setAnalyseError("");
    setIsAnalysing(true);
    setSelectedWord("");
    setSelectedSentenceIndex(null);

    setTimeout(() => {
      try {
        const readability = calculateReadability(trimmed);
        const analysed = analyseSentences(trimmed);
        const top5 = topFiveHardest(analysed);

        const sentences: SentenceResult[] = top5.map((s) => ({
          ...s,
          level: difficultyLevel(s.score),
          reason: buildReason(s),
          preview: s.text.length > 80 ? s.text.slice(0, 77) + "…" : s.text,
        }));

        const difficultWords = detectDifficultWords(trimmed);
        const result: AppAnalysis = { readability, sentences, difficultWords, isStale: false };

        setAnalysis(result);

        // Save to history (replace an older entry with identical text)
        const entry: HistoryEntry = {
          id: makeId(),
          createdAt: Date.now(),
          filename,
          text: trimmed,
          analysis: result,
        };
        setHistory((prev) =>
          [entry, ...prev.filter((e) => e.text !== trimmed)].slice(0, MAX_HISTORY)
        );
      } catch (err) {
        setAnalyseError("An unexpected error occurred during analysis. Please try again.");
        console.error(err);
      } finally {
        setIsAnalysing(false);
      }
    }, 0);
  }, [text, filename]);

  const openHistoryEntry = useCallback(
    (id: string) => {
      const entry = history.find((e) => e.id === id);
      if (!entry) return;
      setTextRaw(entry.text);
      setFilename(entry.filename);
      setAnalysis({ ...entry.analysis, isStale: false });
      setAnalyseError("");
      setSelectedWord("");
      setSelectedSentenceIndex(null);
    },
    [history],
  );

  const deleteHistoryEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  const value: AppCtx = {
    text, setText, filename, setFilename,
    analysis, isAnalysing, analyseError,
    runAnalysis, clearFile,
    selectedWord, setSelectedWord,
    selectedSentenceIndex, setSelectedSentenceIndex,
    chapterRef,
    history, openHistoryEntry, deleteHistoryEntry, clearHistory,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}