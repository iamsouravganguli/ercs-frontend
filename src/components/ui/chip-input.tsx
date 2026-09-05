"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";

interface ChipInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> {
  value?: string;
  onValueChange?: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

const DELIMITERS = [",", " ", ";", "|", "\n", "\t"];

function splitToChips(str: string): string[] {
  return str
    .split(/[,;\n]+/)
    .flatMap((s) => s.split(/\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ChipInput({
  value = "",
  onValueChange,
  placeholder,
  disabled,
  readOnly,
  className,
  ...props
}: ChipInputProps) {
  const chips = React.useMemo(() => splitToChips(value), [value]);
  const [inputVal, setInputVal] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const updateChips = (nextChips: string[]) => {
    const nextVal = nextChips.join(", ");
    onValueChange?.(nextVal);
  };

  const addChip = (raw: string) => {
    const trimmed = raw
      .trim()
      .replace(/[,;]+$/, "")
      .trim();
    if (!trimmed) return;

    const newOnes = splitToChips(trimmed);
    if (newOnes.length === 0) return;
    const merged = [...chips];
    for (const n of newOnes) {
      if (!merged.includes(n)) merged.push(n);
    }
    updateChips(merged);
  };

  const removeChip = (idx: number) => {
    if (readOnly || disabled) return;
    const next = chips.filter((_, i) => i !== idx);
    updateChips(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (readOnly || disabled) return;
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      const hasContent = inputVal.trim().length > 0;
      if (hasContent) {
        e.preventDefault();
        addChip(inputVal);
        setInputVal("");
      } else if (e.key === "Enter") {
        e.preventDefault();
      }
    } else if (e.key === "Backspace" && inputVal === "" && chips.length > 0) {
      e.preventDefault();
      removeChip(chips.length - 1);
    }
    props.onKeyDown?.(e as React.KeyboardEvent<HTMLInputElement>);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;

    const lastChar = v.slice(-1);
    if (DELIMITERS.includes(lastChar)) {
      const before = v.slice(0, -1);
      if (before.trim()) {
        addChip(before);
        setInputVal("");
      } else {
        setInputVal("");
      }
      return;
    }

    if (/[,;\n]/.test(v) || v.includes(" ")) {

      if (
        v.includes(",") ||
        v.includes(";") ||
        v.includes("\n") ||
        (v.split(" ").length > 1 && v.trim().includes(" "))
      ) {

        const parts = splitToChips(v);
        if (
          parts.length > 1 ||
          (parts.length === 1 && (v.includes(",") || v.includes(";")))
        ) {
          const lastPart =
            v.endsWith(",") || v.endsWith(" ") || v.endsWith(";")
              ? ""
              : parts.pop() || "";
          if (parts.length) {
            const merged = [...chips];
            for (const p of parts) if (!merged.includes(p)) merged.push(p);
            updateChips(merged);
          }
          setInputVal(lastPart);
          return;
        }
      }
    }
    setInputVal(v);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (readOnly || disabled) return;
    const text = e.clipboardData.getData("text");
    if (/[,;\n]/.test(text) || text.trim().includes(" ")) {
      e.preventDefault();
      const parts = splitToChips(text);
      if (parts.length) {
        const merged = [...chips];
        for (const p of parts) if (!merged.includes(p)) merged.push(p);
        updateChips(merged);
      }
    }
  };

  const handleBlur = () => {
    if (inputVal.trim()) {
      addChip(inputVal);
      setInputVal("");
    }
    props.onBlur?.(
      null as unknown as React.FocusEvent<HTMLInputElement, Element>,
    );
  };

  return (
    <div
      onClick={() => !readOnly && !disabled && inputRef.current?.focus()}
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900/50 px-2 py-1.5 text-base md:text-[15px] transition-colors outline-none",
        "focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50 focus-within:bg-white",
        (readOnly || disabled) && "bg-muted opacity-60 pointer-events-none",
        className,
      )}
    >
      {chips.map((chip, idx) => (
        <span
          key={`${chip}-${idx}`}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium"
        >
          {chip}
          {!readOnly && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeChip(idx);
              }}
              className="rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 -mr-1"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {!readOnly && !disabled ? (
        <input
          ref={inputRef}
          value={inputVal}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={chips.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
          {...props}
        />
      ) : chips.length === 0 ? (
        <span className="text-sm text-muted-foreground">{placeholder}</span>
      ) : null}
    </div>
  );
}
