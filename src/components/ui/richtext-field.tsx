"use client";


import { Control, FieldValues, Path } from "react-hook-form";
import {
  useMemo,
  type ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Mic, MicOff } from "lucide-react";
import dynamic from "next/dynamic";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { cn } from "@/lib/cn";


const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");
    return RQ;
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-40 w-full bg-muted animate-pulse rounded-md border border-input" />
    ),
  },
) as any;

import "react-quill-new/dist/quill.snow.css";


type RichTextFieldSize = "sm" | "default" | "lg";
type SizeConfig = { minHeight: string; toolbar: string; infoSize: number };

const sizeConfig: Record<RichTextFieldSize, SizeConfig> = {
  sm: { minHeight: "120px", toolbar: "scale-90 origin-left", infoSize: 12 },
  default: { minHeight: "200px", toolbar: "", infoSize: 14 },
  lg: { minHeight: "350px", toolbar: "scale-105 origin-left", infoSize: 16 },
};

type RichTextFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: ReactNode;
  description?: string;
  required?: boolean;
  containerClassName?: string;
  className?: string;
  placeholder?: string;
  fieldSize?: RichTextFieldSize;
  readonly?: boolean;
  maxWords?: number;
};


export function RichTextField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  description: _description,
  required,
  placeholder,
  className,
  containerClassName,
  fieldSize = "default",
  readonly,
  maxWords,
}: RichTextFieldProps<T>) {
  void _description;
  const s = sizeConfig[fieldSize];

  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"en-IN" | "hi-IN">("hi-IN");
  const [speechError, setSpeechError] = useState<string | null>(null);

  const quillRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const activeRef = useRef(false);
  const fatalRef = useRef(false);
  const onChangeRef = useRef<((val: string) => void) | null>(null);
  const voiceLangRef = useRef(voiceLang);

  useEffect(() => {
    voiceLangRef.current = voiceLang;
  }, [voiceLang]);

  const modules = useMemo(
    () => ({
      toolbar: [
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
      ],
    }),
    [],
  );

  const supported =
    typeof window !== "undefined" &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  const insertTranscript = useCallback((text: string) => {
    const transcript = text.trim();
    if (!transcript) return;
    const onChange = onChangeRef.current;

    try {
      const quill =
        quillRef.current?.getEditor?.() ??
        quillRef.current?.editor ??
        quillRef.current;
      if (
        quill &&
        typeof quill.getSelection === "function" &&
        typeof quill.insertText === "function"
      ) {
        const range = quill.getSelection(true);
        const position = range ? range.index : quill.getLength();
        quill.insertText(position, `${transcript} `, "user");
        quill.setSelection(position + transcript.length + 1);
        const html =
          typeof quill.getSemanticHTML === "function"
            ? quill.getSemanticHTML()
            : (quill.root?.innerHTML ?? "");
        if (onChange) onChange(html);
        return;
      }
    } catch {

    }


    try {
      const editorEl =
        (containerRef.current?.querySelector(
          ".ql-editor",
        ) as HTMLElement | null) ??
        (document.querySelector(
          ".rich-text-container .ql-editor",
        ) as HTMLElement | null);
      if (editorEl) {
        editorEl.focus({ preventScroll: true } as any);

        const inserted = (document as any).execCommand?.(
          "insertText",
          false,
          `${transcript} `,
        );
        if (!inserted) {

          const sel = window.getSelection();
          const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
          if (range && editorEl.contains(range.commonAncestorContainer)) {
            range.deleteContents();
            range.insertNode(document.createTextNode(`${transcript} `));
            range.collapse(false);
          } else {
            editorEl.appendChild(document.createTextNode(`${transcript} `));
          }
        }

        editorEl.dispatchEvent(new Event("input", { bubbles: true }));

        const quill = quillRef.current?.getEditor?.() ?? quillRef.current;
        const html =
          quill?.root?.innerHTML ??
          (quill?.getSemanticHTML
            ? quill.getSemanticHTML()
            : editorEl.innerHTML);
        if (onChange && html) onChange(html);
        return;
      }
    } catch {}


    if (onChange) {


      onChange(`${transcript} `);
    }
  }, []);

  const startRecognition = useCallback(() => {
    if (!supported) return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = voiceLangRef.current;

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result?.isFinal) continue;
        const transcript = result[0]?.transcript;
        if (transcript) insertTranscript(transcript);
      }
    };

    recognition.onerror = (e: any) => {
      if (e?.error === "no-speech") return;
      fatalRef.current = true;
      activeRef.current = false;
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        setSpeechError(
          voiceLangRef.current === "hi-IN"
            ? "माइक की अनुमति नहीं मिली — ब्राउज़र सेटिंग में माइक सक्षम करें"
            : "Microphone permission denied — please allow mic access",
        );
      } else if (e?.error === "audio-capture") {
        setSpeechError(
          voiceLangRef.current === "hi-IN"
            ? "माइक्रोफ़ोन नहीं मिला — कृपया माइक कनेक्ट करें"
            : "Microphone not found — please connect a microphone",
        );
      } else if (e?.error === "network") {
        setSpeechError(
          voiceLangRef.current === "hi-IN"
            ? "नेटवर्क त्रुटि — इंटरनेट कनेक्शन जांचें"
            : "Network error — please check internet connection",
        );
      } else if (e?.error === "language-not-supported") {
        setSpeechError(
          voiceLangRef.current === "hi-IN"
            ? "भाषा सपोर्ट नहीं है — कृपया दूसरी भाषा चुनें"
            : "Language not supported",
        );
      } else {
        setSpeechError(
          e?.error ? `Error: ${e.error}` : "Speech recognition error",
        );
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (fatalRef.current) {
        fatalRef.current = false;
        return;
      }
      if (!activeRef.current) {
        setIsListening(false);
        return;
      }

      setTimeout(() => {

        if (activeRef.current && !fatalRef.current) startRecognition();
      }, 300);
    };

    try {
      recognition.start();
    } catch (err) {

      setSpeechError(
        (err as any)?.message || "Failed to start speech recognition",
      );
      setIsListening(false);
      activeRef.current = false;
    }
  }, [supported, insertTranscript]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      fatalRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleSpeechRecognition = (onChange: (val: string) => void) => {
    if (!supported) {
      const msg =
        voiceLangRef.current === "hi-IN"
          ? "यह ब्राउज़र वॉइस टाइपिंग सपोर्ट नहीं करता — कृपया Chrome/Edge उपयोग करें"
          : "This browser does not support speech recognition — please use Chrome or Edge";
      setSpeechError(msg);
      alert(msg);
      return;
    }

    onChangeRef.current = onChange;

    if (activeRef.current) {
      activeRef.current = false;
      fatalRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    activeRef.current = true;
    fatalRef.current = false;
    setSpeechError(null);
    startRecognition();
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const textValue = field.value
          ? String(field.value)
              .replace(/<[^>]*>?/gm, "")
              .replace(/&nbsp;/g, " ")
          : "";
        const wordCount = textValue.trim()
          ? textValue.trim().split(/\s+/).length
          : 0;
        const isOverLimit = maxWords !== undefined && wordCount > maxWords;


        if (activeRef.current) onChangeRef.current = field.onChange;

        return (
          <FormItem className={containerClassName}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-3">
                {label && (
                  <FormLabel className="text-sm font-medium m-0">
                    {label}{" "}
                    {required && (
                      <span className="ml-0.5 text-destructive">*</span>
                    )}
                  </FormLabel>
                )}
                {maxWords !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-widest uppercase",
                      isOverLimit
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    ({wordCount} / {maxWords} words)
                  </span>
                )}
              </div>
            </div>

            <FormControl>
              <div
                ref={containerRef}
                className={cn(
                  "rich-text-container w-full rounded-lg overflow-hidden transition-colors border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 relative",
                  !readonly &&
                    "focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50 focus-within:bg-white dark:focus-within:bg-zinc-900",
                  readonly &&
                    "bg-zinc-50 dark:bg-zinc-800/50 pointer-events-none is-readonly opacity-80",
                  className,
                )}
              >
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
                  {!readonly && !isListening && (
                    <div className="flex border rounded-md overflow-hidden h-7 bg-background shadow-sm">
                      <button
                        type="button"
                        onClick={() => setVoiceLang("en-IN")}
                        className={cn(
                          "px-2 text-[10px] font-bold transition-colors border-r",
                          voiceLang === "en-IN"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoiceLang("hi-IN")}
                        className={cn(
                          "px-2 text-[10px] font-bold transition-colors",
                          voiceLang === "hi-IN"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        HI
                      </button>
                    </div>
                  )}
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => toggleSpeechRecognition(field.onChange)}
                      title={
                        !supported
                          ? "Voice input not supported in this browser"
                          : isListening
                            ? "Stop listening"
                            : voiceLang === "hi-IN"
                              ? "बोलकर लिखें"
                              : "Start voice dictation"
                      }
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all border shadow-sm h-7",
                        isListening
                          ? "bg-destructive text-destructive-foreground border-destructive animate-pulse"
                          : "bg-background text-muted-foreground hover:text-foreground border-input",
                        !supported && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                      {isListening
                        ? "Listening..."
                        : voiceLang === "hi-IN"
                          ? "बोलें"
                          : "Speak"}
                    </button>
                  )}
                </div>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={field.value || ""}
                  onChange={field.onChange}
                  modules={modules}
                  placeholder={placeholder}
                  readOnly={readonly}
                />
              </div>
            </FormControl>
            {speechError && !readonly && (
              <p className="text-xs text-destructive dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-full w-fit px-2.5 py-1 flex items-center gap-1.5 mt-1.5 shadow-sm">
                {speechError}
                <button
                  type="button"
                  onClick={() => setSpeechError(null)}
                  className="underline font-medium ml-1 hover:text-destructive/80 dark:hover:text-red-300"
                >
                  Dismiss
                </button>
              </p>
            )}
            <FormMessage />

            <style
              dangerouslySetInnerHTML={{
                __html: `
            .rich-text-container .ql-toolbar.ql-snow {
              border: none !important; border-bottom: 1px solid #e2e8f0 !important;
              background: #ffffff !important; padding: 8px !important;
              padding-right: 150px !important; ${s.toolbar}
            }
            .dark .rich-text-container .ql-toolbar.ql-snow {
              background: #18181b !important; border-bottom-color: #27272a !important;
            }
            .rich-text-container .ql-container.ql-snow {
              border: none !important; font-family: var(--font-sans) !important;
              height: ${s.minHeight}; background: #ffffff !important;
            }
            .dark .rich-text-container .ql-container.ql-snow {
              background: #18181b !important;
            }
            .rich-text-container .ql-editor { padding: 16px !important; color: var(--foreground) !important; line-height: 1.6; background: #ffffff !important; }
            .dark .rich-text-container .ql-editor { background: #18181b !important; }
            .rich-text-container .ql-snow .ql-stroke { stroke: var(--foreground) !important; }
            .rich-text-container .ql-snow .ql-fill { fill: var(--foreground) !important; }
            .rich-text-container .ql-snow .ql-picker { color: var(--foreground) !important; }
            .rich-text-container .ql-snow .ql-picker-options {
              background-color: var(--card) !important; border: 1px solid var(--border) !important; border-radius: var(--radius) !important;
            }
            .rich-text-container .ql-snow .ql-picker-item { color: var(--foreground) !important; }
            .rich-text-container .ql-editor.ql-blank::before {
              font-style: normal !important;
              color: var(--muted-foreground) !important;
              opacity: 0.6 !important;
            }


            .rich-text-container.is-readonly .ql-toolbar.ql-snow {
              display: none !important;
            }
            .rich-text-container.is-readonly .ql-container.ql-snow {
              background: transparent !important;
              height: auto !important;
              min-height: 120px !important;
            }
            .rich-text-container.is-readonly .ql-editor {
              background: transparent !important;
              min-height: 120px !important;
            }
          `,
              }}
            />
          </FormItem>
        );
      }}
    />
  );
}
