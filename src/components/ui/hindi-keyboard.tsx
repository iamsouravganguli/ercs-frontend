import {
  useState,
  useRef,
  useCallback,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Keyboard, Mic } from "lucide-react";
import { usePathname } from "next/navigation";


type HardwareLayout = "inscript" | "remington";


const INSCRIPT: Record<string, [string, string]> = {
  Backquote: ["ो", "ॉ"],
  Digit1: ["१", "!"],
  Digit2: ["२", "@"],
  Digit3: ["३", "#"],
  Digit4: ["४", "₹"],
  Digit5: ["५", "%"],
  Digit6: ["६", "^"],
  Digit7: ["७", "&"],
  Digit8: ["८", "*"],
  Digit9: ["९", "("],
  Digit0: ["०", ")"],
  Minus: ["-", "_"],
  Equal: ["ृ", "ॄ"],
  KeyQ: ["ौ", "ॊ"],
  KeyW: ["ै", "ॆ"],
  KeyE: ["ा", "ऑ"],
  KeyR: ["ी", "ई"],
  KeyT: ["ू", "ऊ"],
  KeyY: ["ब", "भ"],
  KeyU: ["ह", "ङ"],
  KeyI: ["ग", "घ"],
  KeyO: ["द", "ध"],
  KeyP: ["ज", "झ"],
  BracketLeft: ["ड", "ढ"],
  BracketRight: ["़", "ञ"],
  Backslash: ["ञ", "ण"],
  KeyA: ["ो", "ओ"],
  KeyS: ["े", "ए"],
  KeyD: ["्", "अ"],
  KeyF: ["ि", "इ"],
  KeyG: ["ु", "उ"],
  KeyH: ["प", "फ"],
  KeyJ: ["र", "ऱ"],
  KeyK: ["क", "ख"],
  KeyL: ["त", "थ"],
  Semicolon: ["च", "छ"],
  Quote: ["ट", "ठ"],
  KeyZ: ["ं", "ँ"],
  KeyX: ["ॅ", "ॆ"],
  KeyC: ["म", "ण"],
  KeyV: ["न", "ञ"],
  KeyB: ["व", "ळ"],
  KeyN: ["ल", "ऌ"],
  KeyM: ["स", "श"],
  Comma: ["ष", ","],
  Period: ["य", "."],
  Slash: ["।", "?"],
  Space: [" ", " "],
};

const REMINGTON: Record<string, [string, string]> = {
  Backquote: ["्", "॒"],
  Digit1: ["1", "%"],
  Digit2: ["2", '"'],
  Digit3: ["3", "म"],
  Digit4: ["4", "र"],
  Digit5: ["5", "ज"],
  Digit6: ["6", "त"],
  Digit7: ["7", "ल"],
  Digit8: ["8", "स"],
  Digit9: ["9", "व"],
  Digit0: ["0", "न"],
  Minus: ["ण", "ञ"],
  Equal: ["़", "ॅ"],
  KeyQ: ["ौ", "ॊ"],
  KeyW: ["ै", "ॆ"],
  KeyE: ["ा", "ऑ"],
  KeyR: ["ी", "ई"],
  KeyT: ["ू", "ऊ"],
  KeyY: ["ब", "भ"],
  KeyU: ["ह", "ङ"],
  KeyI: ["ग", "घ"],
  KeyO: ["द", "ध"],
  KeyP: ["ज", "झ"],
  BracketLeft: ["ड", "ढ"],
  BracketRight: ["़", "ञ"],
  Backslash: ["ञ", "ण"],
  KeyA: ["ो", "ओ"],
  KeyS: ["े", "ए"],
  KeyD: ["्", "अ"],
  KeyF: ["ि", "इ"],
  KeyG: ["ु", "उ"],
  KeyH: ["प", "फ"],
  KeyJ: ["र", "ऱ"],
  KeyK: ["क", "ख"],
  KeyL: ["त", "थ"],
  Semicolon: ["च", "छ"],
  Quote: ["ट", "ठ"],
  KeyZ: ["ं", "ँ"],
  KeyX: ["ॅ", "ॆ"],
  KeyC: ["म", "ण"],
  KeyV: ["न", "ञ"],
  KeyB: ["व", "ळ"],
  KeyN: ["ल", "ऌ"],
  KeyM: ["स", "श"],
  Comma: ["ष", ","],
  Period: ["य", "."],
  Slash: ["।", "?"],
  Space: [" ", " "],
};

const HARDWARE_MAPS: Record<
  HardwareLayout,
  Record<string, [string, string]>
> = {
  inscript: INSCRIPT,
  remington: REMINGTON,
};

const HARDWARE_LABELS: Record<HardwareLayout, string> = {
  inscript: "InScript",
  remington: "Remington",
};

type VirtualMode = "hindi" | "matra" | "number";

const LAYOUTS: Record<VirtualMode, string[][]> = {
  hindi: [
    ["क", "ख", "ग", "घ", "च", "छ", "ज", "झ", "ट", "ठ"],
    ["ड", "ढ", "ण", "त", "थ", "द", "ध", "न", "प", "फ"],
    ["ब", "भ", "म", "य", "र", "ल", "व", "श", "ष", "स"],
    ["ह", "अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ओ", "ऑ"],
  ],
  matra: [
    ["ा", "ि", "ी", "ु", "ू", "े", "ै", "ो", "ौ", "ृ"],
    ["ं", "ः", "ँ", "्", "़", "।", "॥", "ऽ", "ॐ", "ज्ञ"],
    ["क्ष", "त्र", "श्र", "ड़", "ढ़", "ऋ", "ऐ", "औ", "ऑ", "ळ"],
  ],
  number: [
    ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
    [",", ".", "?", "!", "-", "(", ")", "₹", "%", "@"],
  ],
};

const MODE_LABELS: Record<VirtualMode, string> = {
  hindi: "हिंदी",
  matra: "मात्रा",
  number: "अंक",
};


interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error:
    | "no-speech"
    | "aborted"
    | "audio-capture"
    | "network"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported";
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare const SpeechRecognition: {
  new (): SpeechRecognition;
};

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

interface HindiKeyboardContextValue {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  minimized: boolean;
  setMinimized: (v: boolean) => void;
  hardwareLayout: HardwareLayout;
  setHardwareLayout: (v: HardwareLayout) => void;
  onPointerDownOutside: (e: Event) => void;
}

const HindiKeyboardContext = createContext<HindiKeyboardContextValue | null>(
  null,
);

export function useHindiKeyboard(): HindiKeyboardContextValue {
  const ctx = useContext(HindiKeyboardContext);
  if (!ctx)
    throw new Error(
      "useHindiKeyboard must be used inside HindiKeyboardProvider",
    );
  return ctx;
}

export function HindiKeyboardProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [hardwareLayout, setHardwareLayout] =
    useState<HardwareLayout>("inscript");

  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastInputRef = useRef<HTMLElement | null>(null);

  const openRef = useRef(open);
  const minimizedRef = useRef(minimized);
  const hardwareLayoutRef = useRef(hardwareLayout);

  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    minimizedRef.current = minimized;
  }, [minimized]);
  useEffect(() => {
    hardwareLayoutRef.current = hardwareLayout;
  }, [hardwareLayout]);


  useEffect(() => {
    const stored = localStorage.getItem("hindi-typing-enabled");
    if (stored !== null) setEnabled(stored === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("hindi-typing-enabled", String(enabled));
    if (!enabled) {
      setOpen(false);
      setMinimized(false);
    }
  }, [enabled]);


  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t.isContentEditable
      ) {
        lastInputRef.current = t;
      }
    };
    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const a = document.activeElement;
      if (
        a instanceof HTMLElement &&
        (a instanceof HTMLInputElement ||
          a instanceof HTMLTextAreaElement ||
          a.isContentEditable)
      ) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, []);

  const onPointerDownOutside = useCallback((e: Event) => {
    const native = (e as CustomEvent).detail?.originalEvent as
      | PointerEvent
      | undefined;
    const target = native?.target ?? (e as PointerEvent).target;
    if (panelRef.current?.contains(target as Node)) {
      e.preventDefault();
    }
  }, []);

  const getNativeSetter = (el: HTMLInputElement | HTMLTextAreaElement) => {
    const proto =
      el instanceof HTMLInputElement
        ? window.HTMLInputElement.prototype
        : window.HTMLTextAreaElement.prototype;
    return Object.getOwnPropertyDescriptor(proto, "value")?.set ?? null;
  };

  const restoreAndGet = useCallback((): HTMLElement | null => {
    const el = lastInputRef.current;
    if (!el || !document.body.contains(el)) return null;
    el.focus({ preventScroll: true });
    return el;
  }, []);


  const insertText = useCallback(
    (char: string) => {
      const el = restoreAndGet();
      if (!el) return;

      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const newValue = el.value.slice(0, start) + char + el.value.slice(end);
        const newCursor = start + char.length;
        const setter = getNativeSetter(el);
        setter ? setter.call(el, newValue) : (el.value = newValue);
        el.setSelectionRange(newCursor, newCursor);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (el.isContentEditable) {
        document.execCommand("insertText", false, char);
      }
    },
    [restoreAndGet],
  );


  const doBackspace = useCallback(() => {
    const el = restoreAndGet();
    if (!el) return;

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      let newValue: string;
      let newCursor: number;

      if (start !== end) {
        newValue = el.value.slice(0, start) + el.value.slice(end);
        newCursor = start;
      } else if (start > 0) {
        if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
          const seg = new (Intl as any).Segmenter("hi", {
            granularity: "grapheme",
          });
          const segments = [...seg.segment(el.value.slice(0, start))];
          const removeLen = segments[segments.length - 1]?.segment.length ?? 1;
          newValue =
            el.value.slice(0, start - removeLen) + el.value.slice(start);
          newCursor = start - removeLen;
        } else {
          newValue = el.value.slice(0, start - 1) + el.value.slice(start);
          newCursor = start - 1;
        }
      } else return;

      const setter = getNativeSetter(el);
      setter ? setter.call(el, newValue) : (el.value = newValue);
      el.setSelectionRange(newCursor, newCursor);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (el.isContentEditable) {
      document.execCommand("delete", false);
    }
  }, [restoreAndGet]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!openRef.current) return;
      const active = document.activeElement as HTMLElement;
      if (!active) return;

      const isEditable =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active.isContentEditable;

      if (!isEditable || active !== lastInputRef.current) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const map = HARDWARE_MAPS[hardwareLayoutRef.current];
      const mapping = map[e.code];
      if (!mapping) return;

      e.preventDefault();
      e.stopPropagation();

      if (!minimizedRef.current) setMinimized(true);
      insertText(e.shiftKey ? mapping[1] : mapping[0]);
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [insertText]);

  return (
    <HindiKeyboardContext.Provider
      value={{
        enabled,
        setEnabled,
        open,
        setOpen,
        minimized,
        setMinimized,
        hardwareLayout,
        setHardwareLayout,
        onPointerDownOutside,
      }}
    >
      {children}
      <KeyboardPortal
        open={open}
        setOpen={setOpen}
        minimized={minimized}
        setMinimized={setMinimized}
        hardwareLayout={hardwareLayout}
        setHardwareLayout={setHardwareLayout}
        insertText={insertText}
        doBackspace={doBackspace}
        panelRef={panelRef}
        lastInputRef={lastInputRef}
      />
    </HindiKeyboardContext.Provider>
  );
}


interface KBProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  minimized: boolean;
  setMinimized: (v: boolean) => void;
  hardwareLayout: HardwareLayout;
  setHardwareLayout: (v: HardwareLayout) => void;
  insertText: (ch: string) => void;
  doBackspace: () => void;
  panelRef: React.MutableRefObject<HTMLDivElement | null>;
  lastInputRef: React.MutableRefObject<HTMLElement | null>;
}

function KeyboardPortal(props: KBProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { enabled } = useHindiKeyboard();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;


  if (!enabled) return null;


  if (
    pathname &&
    (pathname === "/action/support/tickets/chat" ||
      pathname.startsWith("/action/support/tickets/chat"))
  ) {
    return null;
  }

  return createPortal(<KeyboardUI {...props} />, document.body);
}


type MicStatus = "off" | "listening" | "error";

function useContinuousMic(onTranscript: (text: string) => void): {
  micStatus: MicStatus;
  micError: string | null;
  toggleMic: () => void;
  supported: boolean;
} {
  const [micStatus, setMicStatus] = useState<MicStatus>("off");
  const [micError, setMicError] = useState<string | null>(null);
  const recogRef = useRef<SpeechRecognition | null>(null);
  const activeRef = useRef(false);
  const fatalRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const supported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const startRecognition = useCallback(() => {
    if (!supported) return;


    if (recogRef.current) {
      try {
        recogRef.current.onend = null;
        recogRef.current.abort();
      } catch (_) {}
      recogRef.current = null;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "hi-IN";
    r.continuous = true;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onstart = () => {
      setMicStatus("listening");
      setMicError(null);
    };

    r.onresult = (e: SpeechRecognitionEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result?.isFinal) {
          const transcript = result[0]?.transcript;
          if (transcript) onTranscriptRef.current(transcript);
        }
      }
    };

    r.onerror = (e: SpeechRecognitionErrorEvent) => {

      if (e.error === "no-speech") return;


      fatalRef.current = true;
      activeRef.current = false;

      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicError("माइक की अनुमति नहीं मिली");
      } else if (e.error === "audio-capture") {
        setMicError("माइक्रोफ़ोन नहीं मिला — कृपया माइक कनेक्ट करें");
      } else if (e.error === "network") {
        setMicError("नेटवर्क त्रुटि — इंटरनेट कनेक्शन जांचें");
      } else {
        setMicError(`त्रुटि: ${e.error}`);
      }
      setMicStatus("error");
    };

    r.onend = () => {

      if (fatalRef.current) {
        fatalRef.current = false;
        return;
      }

      if (!activeRef.current) {
        setMicStatus("off");
        return;
      }


      setTimeout(() => {
        if (activeRef.current && !fatalRef.current) {
          startRecognition();
        }
      }, 300);
    };

    recogRef.current = r;
    try {
      r.start();
    } catch (_) {}

  }, [supported]);

  const toggleMic = useCallback(() => {
    if (!supported) {
      setMicError("यह ब्राउज़र Web Speech API सपोर्ट नहीं करता");
      setMicStatus("error");
      return;
    }
    if (activeRef.current) {

      activeRef.current = false;
      fatalRef.current = false;
      if (recogRef.current) {
        try {
          recogRef.current.onend = null;
          recogRef.current.stop();
        } catch (_) {}
        recogRef.current = null;
      }
      setMicStatus("off");
    } else {

      activeRef.current = true;
      fatalRef.current = false;
      setMicError(null);
      setMicStatus("off");
      startRecognition();
    }
  }, [supported, startRecognition]);


  useEffect(() => {
    return () => {
      activeRef.current = false;
      recogRef.current?.stop();
    };
  }, []);

  return { micStatus, micError, toggleMic, supported };
}


function KeyboardUI({
  open,
  setOpen,
  minimized,
  setMinimized,
  hardwareLayout,
  setHardwareLayout,
  insertText,
  doBackspace,
  panelRef,
  lastInputRef,
}: KBProps) {
  const [mode, setMode] = useState<VirtualMode>("hindi");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [micPanelOpen, setMicPanelOpen] = useState(false);

  const dragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, panelLeft: 0, panelTop: 0 });
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);


  const handleTranscript = useCallback(
    (text: string) => {
      const el = lastInputRef.current;
      if (!el || !document.body.contains(el)) {
        insertText(text);
        return;
      }
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const proto =
          el instanceof HTMLInputElement
            ? window.HTMLInputElement.prototype
            : window.HTMLTextAreaElement.prototype;
        const setter =
          Object.getOwnPropertyDescriptor(proto, "value")?.set ?? null;
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const newValue = el.value.slice(0, start) + text + el.value.slice(end);
        const newCursor = start + text.length;
        setter ? setter.call(el, newValue) : (el.value = newValue);
        el.setSelectionRange(newCursor, newCursor);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (el.isContentEditable) {
        el.focus({ preventScroll: true });
        document.execCommand("insertText", false, text);
      }
    },
    [insertText, lastInputRef],
  );

  const { micStatus, micError, toggleMic, supported } =
    useContinuousMic(handleTranscript);


  const [audioHeights, setAudioHeights] = useState<number[]>([0, 0, 0, 0, 0]);
  const [h0 = 0, h1 = 0, h2 = 0, h3 = 0, h4 = 0] = audioHeights;
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentHeightsRef = useRef<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    if (micStatus !== "listening") {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch(() => {});
        }
        audioContextRef.current = null;
      }
      if (audioStreamRef.current) {
        try {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
        } catch (_) {}
        audioStreamRef.current = null;
      }
      setAudioHeights([0, 0, 0, 0, 0]);
      currentHeightsRef.current = [0, 0, 0, 0, 0];
      return;
    }

    let active = true;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!active || micStatus !== "listening") {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        audioStreamRef.current = stream;

        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;


        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVisuals = () => {
          if (!active || micStatus !== "listening") return;
          analyser.getByteFrequencyData(dataArray);

          const targetHeights = [0, 0, 0, 0, 0];
          if (dataArray.length > 0) {

            const step = Math.max(1, Math.floor((dataArray.length * 0.75) / 5));
            for (let i = 0; i < 5; i++) {
              let sum = 0;
              let count = 0;
              for (
                let j = i * step;
                j < (i + 1) * step && j < dataArray.length;
                j++
              ) {
                sum += dataArray[j] ?? 0;
                count++;
              }
              const average = count > 0 ? sum / count : 0;

              targetHeights[i] = (average / 255) * 28;
            }
          }


          const lerpFactor = 0.25;
          const smoothedHeights = currentHeightsRef.current.map((curr, idx) => {
            const target = targetHeights[idx] ?? 0;
            return curr + (target - curr) * lerpFactor;
          });

          currentHeightsRef.current = smoothedHeights;
          setAudioHeights(smoothedHeights);

          animationFrameRef.current = requestAnimationFrame(updateVisuals);
        };

        animationFrameRef.current = requestAnimationFrame(updateVisuals);
      })
      .catch((err) => {
        console.error("Audio visualizer error:", err);
      });

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch(() => {});
        }
      }
      if (audioStreamRef.current) {
        try {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
        } catch (_) {}
      }
    };
  }, [micStatus]);


  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !panelRef.current) return;
      const W = panelRef.current.offsetWidth;
      const H = panelRef.current.offsetHeight;
      const left = Math.min(
        Math.max(
          dragStart.current.panelLeft + e.clientX - dragStart.current.mouseX,
          0,
        ),
        window.innerWidth - W,
      );
      const top = Math.min(
        Math.max(
          dragStart.current.panelTop + e.clientY - dragStart.current.mouseY,
          0,
        ),
        window.innerHeight - H,
      );
      setPos({ left, top });
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [panelRef]);

  const startDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    dragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panelLeft: pos?.left ?? rect.left,
      panelTop: pos?.top ?? rect.top,
    };
  };

  const handleKey = (e: React.PointerEvent, id: string, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveKey(id);
    action();
    setTimeout(() => setActiveKey(null), 120);
  };


  const panelStyle: CSSProperties = {
    ...(pos
      ? {
          left: pos.left,
          top: pos.top,
          bottom: "auto",
          right: "auto",
          transform: "none",
        }
      : {
          right: 48,
          top: "50%",
          transform: "translateY(-50%)",
          bottom: "auto",
          left: "auto",
        }),
    position: "fixed",
    zIndex: 9999,
    width: 428,
    pointerEvents: "auto",
    background: "var(--card)",
    color: "var(--card-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "12px 12px 10px",
    userSelect: "none",
    fontFamily: "var(--font-sans)",
  };

  const fabBaseStyle: CSSProperties = {
    pointerEvents: "auto",
    width: 42,
    height: 42,
    borderRadius: "21px 0 0 21px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "1px solid var(--border)",
    borderRight: "none",
    transition: "background 0.15s, color 0.15s, width 0.15s",
    outline: "none",
  };

  const fabStyleKb: CSSProperties = {
    ...fabBaseStyle,
    background: open && !minimized ? "var(--secondary)" : "var(--card)",
    color:
      open && !minimized ? "var(--secondary-foreground)" : "var(--foreground)",
  };

  const fabStyleMic: CSSProperties = {
    ...fabBaseStyle,
    background:
      micStatus === "listening"
        ? "var(--destructive)"
        : micPanelOpen
          ? "var(--secondary)"
          : "var(--card)",
    color:
      micStatus === "listening"
        ? "var(--destructive-foreground)"
        : micPanelOpen
          ? "var(--secondary-foreground)"
          : "var(--foreground)",
    opacity: supported ? 1 : 0.5,
    cursor: supported ? "pointer" : "not-allowed",
  };

  const voicePanelStyle: CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    right: 48,
    top: "50%",
    transform: "translateY(-50%)",
    width: 280,
    background: "var(--card)",
    color: "var(--card-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "12px 0 10px",
    userSelect: "none",
    fontFamily: "var(--font-sans)",
  };

  const keyBase = (id: string): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 34,
    fontSize: 14,
    fontFamily: "var(--font-sans)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    background: activeKey === id ? "var(--accent)" : "var(--muted)",
    color: activeKey === id ? "var(--accent-foreground)" : "var(--foreground)",
    cursor: "pointer",
    transition: "background 0.08s, transform 0.08s",
    transform: activeKey === id ? "scale(0.93)" : "scale(1)",
    flex: 1,
    lineHeight: 1,
    padding: 0,
    touchAction: "none",
    outline: "none",
  });

  const tabStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    height: 26,
    fontSize: 11,
    fontFamily: "var(--font-sans)",
    fontWeight: active ? 600 : 400,
    border: active ? "1px solid var(--secondary)" : "1px solid var(--border)",
    borderRadius: "99px",
    cursor: "pointer",
    outline: "none",
    touchAction: "none",
    background: active ? "var(--secondary)" : "transparent",
    color: active ? "var(--secondary-foreground)" : "var(--muted-foreground)",
    transition: "all 0.15s ease",
  });

  const sectionLabel: CSSProperties = {
    fontSize: 10,
    color: "var(--muted-foreground)",
    fontFamily: "var(--font-sans)",
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    padding: "4px 2px 3px",
    display: "block",
  };


  const getPath = (amplitude: number, phase: number, frequency: number) => {
    let points = "";
    for (let x = 0; x <= 100; x += 1.5) {

      const y = 18 + amplitude * Math.sin(x * frequency + phase);
      if (x === 0) {
        points += `M ${x} ${y}`;
      } else {
        points += ` L ${x} ${y}`;
      }
    }
    return points;
  };


  const [waveTime, setWaveTime] = useState(() => Date.now() * 0.006);
  useEffect(() => {
    if (micStatus !== "listening") return;
    let raf = 0;
    const tick = () => {
      setWaveTime(Date.now() * 0.006);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [micStatus]);
  const pathAmbient = getPath(1.5 + h2 * 0.45, waveTime * 0.8, 0.12);
  const pathSecondary = getPath(3 + h1 * 0.65, -waveTime * 1.3, 0.22);
  const pathMain = getPath(4.5 + h0 * 0.8, waveTime, 0.16);

  return (
    <>
      <style>{`
        @keyframes kb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.65); }
        }
        @keyframes mic-listen {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.95); opacity: 0.9; }
        }
        @keyframes wave-bounce {
          0%, 100% { height: 6px; }
          50% { height: 24px; }
        }
        .hindi-keyboard-fab {
          transition: background 0.15s, color 0.15s, width 0.15s !important;
        }
        .hindi-keyboard-fab:hover {
          width: 48px !important;
        }
        .hindi-keyboard-fab:not(.active-fab):hover {
          background: var(--accent) !important;
          color: var(--accent-foreground) !important;
        }
        .mic-active-anim {
          animation: mic-listen 1.5s infinite ease-in-out;
        }
        .wave-bar {
          width: 4px;
          background: var(--destructive);
          border-radius: 2px;
          transition: height 0.08s ease;
        }
      `}</style>

      {}
      <div
        className="hidden sm:flex flex-col gap-[6px]"
        style={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10000,
          pointerEvents: "none",
        }}
      >
        {}
        <button
          className={`hindi-keyboard-fab hindi-keyboard-fab-kb ${open && !minimized ? "active-fab" : ""}`}
          style={fabStyleKb}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();

            setMicPanelOpen(false);
            if (micStatus === "listening") {
              toggleMic();
            }

            if (!open) {
              setOpen(true);
              setMinimized(false);
            } else if (minimized) {
              setMinimized(false);
            } else {
              setOpen(false);
              setMinimized(false);
            }
          }}
          title="हिंदी वर्चुअल कीबोर्ड"
        >
          {minimized && (
            <span
              style={{
                position: "absolute",
                top: 5,
                left: 5,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--foreground)",
                border: "1px solid var(--card)",
              }}
            />
          )}
          <Keyboard size={18} />
        </button>

        {}
        <button
          className={`hindi-keyboard-fab hindi-keyboard-fab-mic ${micPanelOpen || micStatus === "listening" ? "active-fab" : ""} ${micStatus === "listening" ? "mic-active-anim" : ""}`}
          style={fabStyleMic}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={!supported}
          onClick={(e) => {
            e.stopPropagation();
            if (!supported) return;

            if (micPanelOpen) {
              setMicPanelOpen(false);
              if (micStatus === "listening") {
                toggleMic();
              }
            } else {

              setOpen(false);
              setMinimized(false);

              setMicPanelOpen(true);
              if (micStatus === "off") {
                toggleMic();
              }
            }
          }}
          title={
            supported
              ? "बोलकर लिखें (वॉइस इनपुट)"
              : "वॉइस इनपुट सपोर्टेड नहीं है"
          }
        >
          <Mic size={18} />
        </button>
      </div>

      {}
      {open && !minimized && (
        <div
          ref={panelRef}
          style={panelStyle}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {}
          <div
            onMouseDown={startDrag}
            style={{
              cursor: "move",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              padding: "0 2px 8px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--foreground)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              हिंदी वर्चुअल कीबोर्ड
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                  background: "var(--muted)",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  outline: "none",
                }}
                onClick={() => setMinimized(true)}
                title="छोटा करें"
              >
                −
              </button>
              <button
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                  background: "var(--muted)",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  outline: "none",
                }}
                onClick={() => setOpen(false)}
                title="बंद करें"
              >
                ✕
              </button>
            </div>
          </div>

          {}
          <span style={sectionLabel}>हार्डवेयर layout</span>
          <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
            {(["inscript", "remington"] as HardwareLayout[]).map((hl) => (
              <button
                key={hl}
                style={tabStyle(hardwareLayout === hl)}
                onPointerDown={(e) =>
                  handleKey(e, `hw-${hl}`, () => setHardwareLayout(hl))
                }
              >
                {HARDWARE_LABELS[hl]}
              </button>
            ))}
          </div>

          {}
          <span style={sectionLabel}>वर्चुअल keyboard</span>
          <div style={{ display: "flex", gap: 5, marginBottom: 7 }}>
            {(Object.keys(LAYOUTS) as VirtualMode[]).map((m) => (
              <button
                key={m}
                style={tabStyle(mode === m)}
                onPointerDown={(e) =>
                  handleKey(e, `mode-${m}`, () => setMode(m))
                }
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {LAYOUTS[mode].map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 3, marginBottom: 3 }}>
              {row.map((ch) => (
                <button
                  key={ch}
                  style={keyBase(ch)}
                  onPointerDown={(e) => handleKey(e, ch, () => insertText(ch))}
                >
                  {ch}
                </button>
              ))}
            </div>
          ))}

          <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
            <button
              style={{
                ...keyBase("bs"),
                flex: 1.4,
                color: "var(--destructive)",
              }}
              onPointerDown={(e) => handleKey(e, "bs", doBackspace)}
            >
              ⌫
            </button>
            <button
              style={{ ...keyBase("sp"), flex: 4 }}
              onPointerDown={(e) => handleKey(e, "sp", () => insertText(" "))}
            >
              स्पेस
            </button>
            <button
              style={{
                ...keyBase("en"),
                flex: 1.4,
                color: "var(--foreground)",
              }}
              onPointerDown={(e) => handleKey(e, "en", () => insertText("\n"))}
            >
              ↵
            </button>
          </div>
        </div>
      )}

      {}
      {(!open || minimized) && micPanelOpen && (
        <div style={voicePanelStyle}>
          {}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              padding: "0 14px 8px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--foreground)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Mic
                size={12}
                className={
                  micStatus === "listening"
                    ? "text-destructive animate-pulse"
                    : "text-muted-foreground"
                }
              />
              वॉइस इनपुट (hi-IN)
            </span>
            <button
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                border: "1px solid var(--border)",
                background: "var(--muted)",
                width: 20,
                height: 20,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
                outline: "none",
              }}
              onClick={() => {
                setMicPanelOpen(false);
                if (micStatus === "listening") {
                  toggleMic();
                }
              }}
              title="बंद करें"
            >
              ✕
            </button>
          </div>

          {}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px 0 0",
              gap: 8,
            }}
          >
            {micStatus === "listening" ? (
              <>
                {}
                <div
                  style={{
                    width: "100%",
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    padding: "0 16px",
                    boxSizing: "border-box",
                  }}
                >
                  <svg
                    viewBox="0 0 100 36"
                    preserveAspectRatio="none"
                    style={{ width: "100%", height: "100%" }}
                  >
                    {}
                    <path
                      d={pathAmbient}
                      fill="none"
                      stroke="var(--muted-foreground)"
                      strokeOpacity="0.2"
                      strokeWidth="1.2"
                    />
                    {}
                    <path
                      d={pathSecondary}
                      fill="none"
                      stroke="var(--muted-foreground)"
                      strokeOpacity="0.45"
                      strokeWidth="1.6"
                    />
                    {}
                    <path
                      d={pathMain}
                      fill="none"
                      stroke="var(--foreground)"
                      strokeOpacity="0.8"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    padding: "0 14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--foreground)",
                    }}
                  >
                    सुन रहा हूँ…
                  </span>
                  <span
                    style={{ fontSize: 10, color: "var(--muted-foreground)" }}
                  >
                    बोलें, शब्द अपने आप टाइप होंगे
                  </span>
                </div>
              </>
            ) : micStatus === "error" ? (
              <>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    textAlign: "center",
                    padding: "0 14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--destructive)",
                    }}
                  >
                    {micError ?? "त्रुटि — माइक बंद है"}
                  </span>
                  <button
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--foreground)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 2,
                    }}
                    onClick={() => {
                      toggleMic();
                    }}
                  >
                    पुनः प्रयास करें
                  </button>
                </div>
              </>
            ) : (
              <>
                {}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "2px solid var(--muted)",
                    borderTopColor: "var(--foreground)",
                    animation: "kb-pulse 1s linear infinite",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    padding: "0 14px",
                  }}
                >
                  <span
                    style={{ fontSize: 11, color: "var(--muted-foreground)" }}
                  >
                    माइक चालू हो रहा है…
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
