"use client";
import { cn } from "@/lib/cn";
import { Search, X } from "lucide-react";
import * as React from "react";

export interface SearchInputProps extends Omit<
  React.ComponentProps<"input">,
  "onChange" | "type"
> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
}

export function SearchInput({
  className,
  onSearch,
  debounceMs = 300,
  value,
  ...props
}: SearchInputProps) {
  const [internal, setInternal] = React.useState(value ?? "");
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = React.useRef(false);


  React.useEffect(() => {
    if (!isTypingRef.current) {
      setInternal(value ?? "");
    }
  }, [value]);


  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    isTypingRef.current = true;
    setInternal(val);

    if (!onSearch) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onSearch(val);
    }, debounceMs);
  };

  const handleClear = () => {
    isTypingRef.current = false;
    setInternal("");
    if (onSearch) onSearch("");
  };

  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
        size={14}
        strokeWidth={2.2}
        aria-hidden="true"
      />
      <input
        type="text"
        data-slot="input"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900/50 py-1 pl-8 pr-8 text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 transition-colors outline-none",
          "placeholder:text-muted-foreground",
          "focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:bg-white dark:focus-visible:bg-zinc-900 focus-visible:outline-none",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        value={internal}
        onChange={handleChange}
        {...props}
      />
      {internal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-0.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
