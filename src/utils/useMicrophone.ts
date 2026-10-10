/**
 * ChapterCheck — Web Speech API hook (microphone input)
 * Gracefully degrades when the browser doesn't support SpeechRecognition.
 */
import { useState, useCallback, useRef, useEffect } from "react";

// Minimal local types: TypeScript's DOM lib doesn't ship the Web Speech API
type SpeechAlternative = { transcript: string };
type SpeechResult = { 0: SpeechAlternative; length: number; isFinal: boolean };
type SpeechResultEvent = {
  resultIndex: number;
  results: { length: number;[index: number]: SpeechResult };
};
type SpeechErrorEvent = { error: string };

interface SpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecCtor = new () => SpeechRec;

function getSpeechRecognition(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (
    (w["SpeechRecognition"] as SpeechRecCtor | undefined) ??
    (w["webkitSpeechRecognition"] as SpeechRecCtor | undefined) ??
    null
  );
}

export type MicStatus =
  | "idle"
  | "listening"
  | "done"
  | "denied"
  | "unsupported"
  | "error";

export function useMicrophone(onTranscript: (text: string) => void) {
  const [status, setStatus] = useState<MicStatus>(() =>
    getSpeechRecognition() ? "idle" : "unsupported"
  );
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRec | null>(null);

  // Always call the newest callback, so appended text never goes stale
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Stop listening if the component unmounts
  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    recognitionRef.current?.abort(); // never run two sessions at once

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setStatus("listening");
      setError("");
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript.trim()) onTranscriptRef.current(transcript);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setStatus("denied");
        setError("Microphone permission was denied. Please allow access in your browser settings.");
      } else if (event.error === "no-speech" || event.error === "aborted") {
        setStatus("done"); // not a real failure
      } else {
        setStatus("error");
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Keep "denied"/"error" visible; otherwise the session simply finished
      setStatus((s) => (s === "denied" || s === "error" ? s : "done"));
    };

    try {
      recognition.start();
    } catch {
      setStatus("error");
      setError("Could not start the microphone. Please try again.");
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus("done");
  }, []);

  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    setStatus(getSpeechRecognition() ? "idle" : "unsupported");
    setError("");
  }, []);

  return { status, error, start, stop, reset };
}