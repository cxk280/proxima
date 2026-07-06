/**
 * Thin, feature-detected wrappers around the browser's Web Speech APIs — real speech
 * input (SpeechRecognition) and spoken output (SpeechSynthesis). Everything degrades to a
 * safe no-op / null when the API is unavailable (Firefox, headless, older Safari), so the
 * demo falls back to its scripted flow instead of breaking.
 */

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function recognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionCtor | null;
}

export function supportsSpeechInput(): boolean {
  return recognitionCtor() !== null;
}

/** Capture a single spoken utterance → transcript text, or null if unavailable / nothing heard. */
export function listenOnce(timeoutMs = 8000): Promise<string | null> {
  const Ctor = recognitionCtor();
  if (!Ctor) return Promise.resolve(null);

  return new Promise((resolve) => {
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let done = false;

    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      resolve(value);
    };

    rec.onresult = (e) => finish(e.results?.[0]?.[0]?.transcript?.trim() || null);
    rec.onerror = () => finish(null);
    rec.onend = () => finish(null);
    setTimeout(() => finish(null), timeoutMs);

    try {
      rec.start();
    } catch {
      finish(null);
    }
  });
}

/** Speak text aloud via the browser's TTS. No-op when unavailable. */
export function speak(text: string): void {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}
