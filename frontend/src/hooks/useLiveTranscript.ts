import { useCallback, useRef, useState } from "react";

// Minimal typings for the browser Web Speech API (not in lib.dom for all TS versions).
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const LOCALES: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
};

function getCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Live captions while the user speaks, using the browser's built-in
 * recognizer. This is a preview only: it does not replace the server
 * transcription. Silently does nothing if the browser has no support.
 */
export function useLiveTranscript() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const activeRef = useRef(false);

  const start = useCallback((language: string) => {
    const Ctor = getCtor();
    if (!Ctor) {
      setStatus("Live text is not supported in this browser.");
      return;
    }
    setText("");
    setStatus("Starting live text…");
    const recognition = new Ctor();
    recognition.lang = LOCALES[language] ?? "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript;
      }
      console.log("[LIVE] result:", combined);
      setText(combined);
    };
    recognition.onstart = () => setStatus("Listening… (waiting for speech)");
    recognition.onaudiostart = () => console.log("[LIVE] audio capture started");
    recognition.onspeechstart = () => {
      console.log("[LIVE] speech detected");
      setStatus("Speech detected");
    };
    recognition.onerror = (event) => {
      console.warn("[LIVE] error:", event.error);
      setStatus(`Live text error: ${event.error ?? "unknown"}`);
    };
    // Chrome ends recognition after a pause; restart while still recording.
    recognition.onend = () => {
      if (activeRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          /* already started */
        }
      }
    };
    recognitionRef.current = recognition;
    activeRef.current = true;
    try {
      recognition.start();
    } catch {
      activeRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    try {
      recognition?.stop();
    } catch {
      /* ignore */
    }
    setText("");
    setStatus("");
  }, []);

  return { liveText: text, liveStatus: status, startLive: start, stopLive: stop };
}
