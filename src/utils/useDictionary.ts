/**
 * ChapterCheck — Dictionary hook
 * Primary:  /api/dictionary/:word  (proxies api.dictionaryapi.dev)
 * Fallback: Wiktionary REST API (used when the primary is down/slow)
 * Results are cached for the session.
 *
 * Race-condition guard: each call to lookup() captures its word in a local
 * variable and the shared currentWordRef. setResult() is only called if that
 * word still matches the ref at response time, so a slow earlier response
 * cannot overwrite a faster response for a later word.
 */
import { useState, useCallback, useRef } from "react";

export type Phonetic = {
  text?: string;
  audio?: string;
};

export type Definition = {
  definition: string;
  example?: string;
  synonyms?: string[];
};

export type Meaning = {
  partOfSpeech: string;
  definitions: Definition[];
};

export type DictEntry = {
  word: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
};

export type DictResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; entries: DictEntry[]; word: string }
  | { status: "not_found"; word: string }
  | { status: "error"; word: string; message: string };

// Session-level cache — survives re-renders but not page reloads
const cache = new Map<string, DictResult>();

const PRIMARY_TIMEOUT_MS = 6000;
const FALLBACK_TIMEOUT_MS = 8000;

/** Wiktionary returns definitions as HTML snippets; convert to plain text. */
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Primary source. Returns entries, or null if the word is not found (404).
 * Throws on any other failure so the caller can fall back.
 */
async function fetchPrimary(key: string): Promise<DictEntry[] | null> {
  const res = await fetch(`/api/dictionary/${encodeURIComponent(key)}`, {
    signal: AbortSignal.timeout(PRIMARY_TIMEOUT_MS),
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Received non-JSON response from server");
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response format from dictionary");
  }
  return data as DictEntry[];
}

type WiktionaryResponse = {
  en?: Array<{
    partOfSpeech: string;
    definitions: Array<{ definition: string; examples?: string[] }>;
  }>;
};

/**
 * Fallback source. Returns entries, or null if not found.
 * Throws on network/server failure.
 */
async function fetchWiktionary(key: string): Promise<DictEntry[] | null> {
  const res = await fetch(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(key)}`,
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(FALLBACK_TIMEOUT_MS),
    }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data: WiktionaryResponse = await res.json();
  if (!Array.isArray(data.en) || data.en.length === 0) return null;

  const meanings: Meaning[] = data.en
    .map((section) => ({
      partOfSpeech: section.partOfSpeech.toLowerCase(),
      definitions: section.definitions
        .map((d) => ({
          definition: stripHtml(d.definition),
          example: d.examples?.[0] ? stripHtml(d.examples[0]) : undefined,
        }))
        .filter((d) => d.definition.length > 0),
    }))
    .filter((m) => m.definitions.length > 0);

  if (meanings.length === 0) return null;

  return [{ word: key, phonetics: [], meanings }];
}

export function useDictionary() {
  const [result, setResult] = useState<DictResult>({ status: "idle" });
  // Tracks the most recently requested word; used to discard stale responses
  const currentWordRef = useRef<string>("");

  const lookup = useCallback(async (word: string) => {
    const key = word.toLowerCase();
    currentWordRef.current = key;

    if (cache.has(key)) {
      if (currentWordRef.current === key) {
        setResult(cache.get(key)!);
      }
      return;
    }

    setResult({ status: "loading" });

    try {
      let entries: DictEntry[] | null;
      try {
        entries = await fetchPrimary(key);
      } catch (primaryErr) {
        console.warn("Primary dictionary failed, using Wiktionary:", primaryErr);
        entries = await fetchWiktionary(key);
      }

      // Discard if the user moved on to another word
      if (currentWordRef.current !== key) return;

      if (!entries) {
        const r: DictResult = { status: "not_found", word: key };
        cache.set(key, r);
        setResult(r);
        return;
      }

      const r: DictResult = { status: "found", entries, word: key };
      cache.set(key, r);
      setResult(r);
    } catch (err) {
      if (currentWordRef.current !== key) return;
      const r: DictResult = {
        status: "error",
        word: key,
        message: err instanceof Error ? err.message : "Network error",
      };
      // Don't cache errors so the user can retry
      setResult(r);
    }
  }, []);

  const reset = useCallback(() => {
    currentWordRef.current = "";
    setResult({ status: "idle" });
  }, []);

  return { result, lookup, reset };
}