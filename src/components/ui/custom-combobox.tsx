"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { ChevronDown, X, Loader2, Check } from "lucide-react";

export interface CustomComboboxOption {
  label: string;
  value: string | number;
}

interface CustomComboboxProps {
  options: CustomComboboxOption[];
  value?: string | number | null;
  onValueChange?: (val: string | number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  className?: string;
  emptyText?: string;
  onSearch?: (query: string) => void;
  debounceMs?: number;
  renderOption?: (
    option: CustomComboboxOption,
    state: { isSelected: boolean; isHighlighted: boolean },
  ) => React.ReactNode;
}

export function CustomCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select",
  disabled,
  readOnly,
  loading,
  className,
  emptyText = "No results found.",
  onSearch,
  debounceMs = 300,
  renderOption,
}: CustomComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlighted, setHighlighted] = React.useState<number>(-1);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const [maxHeight, setMaxHeight] = React.useState(240);
  const [portalStyle, setPortalStyle] = React.useState<React.CSSProperties>({});
  const updatePosition = React.useCallback(() => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const gap = 6;
    const margin = 8;
    const spaceBelow = vh - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;
    const maxH = 240;
    let flip = false;
    let mh = 240;
    if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
      flip = false;
      mh = Math.min(maxH, Math.max(120, spaceBelow));
    } else {
      flip = true;
      mh = Math.min(maxH, Math.max(120, spaceAbove));
    }
    setMaxHeight(mh);
    setPortalStyle({
      left: rect.left,
      width: rect.width,
      ...(flip ? { bottom: vh - rect.top + gap } : { top: rect.bottom + gap }),
    });
  }, []);
  React.useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const selected = options.find((o) => String(o.value) === String(value));

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const doSearch = React.useCallback(
    (q: string) => {
      if (!onSearch) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(q), debounceMs);
    },
    [onSearch, debounceMs],
  );
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const dedupedOptions = React.useMemo(() => {
    const seen = new Set<string>();
    return options.filter((o) => {
      const k = String(o.value);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [options]);
  const filtered = React.useMemo(() => {
    if (onSearch) return dedupedOptions;
    if (!query.trim()) return dedupedOptions;
    return dedupedOptions.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase()),
    );
  }, [dedupedOptions, query, onSearch]);

  React.useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current && rootRef.current.contains(target)) return;
      if (listRef.current && listRef.current.contains(target)) return;
      setOpen(false);
      setHighlighted(-1);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSelect = (opt: CustomComboboxOption) => {
    onValueChange?.(opt.value);
    setQuery("");
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.(null);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      setHighlighted(0);
      e.preventDefault();
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && filtered[highlighted]) {
        handleSelect(filtered[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  React.useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-index="${highlighted}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  const autoScrollRef = React.useRef<number | null>(null);
  const stopAutoScroll = React.useCallback(() => {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);
  React.useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);
  React.useEffect(() => {
    if (!open) stopAutoScroll();
  }, [open, stopAutoScroll]);
  const handleAutoScrollMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = listRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const y = e.clientY;
      const topDist = y - rect.top;
      const bottomDist = rect.bottom - y;
      const edge = 60;
      const maxSpeed = 6;
      let speed = 0;
      if (topDist < edge && topDist >= 0) {
        speed = -((edge - topDist) / edge) * maxSpeed - 0.5;
      } else if (bottomDist < edge && bottomDist >= 0) {
        speed = ((edge - bottomDist) / edge) * maxSpeed + 0.5;
      } else {
        stopAutoScroll();
        return;
      }
      if (Math.abs(speed) < 0.3) {
        stopAutoScroll();
        return;
      }
      const step = () => {
        if (!listRef.current) return;
        const canScrollUp = listRef.current.scrollTop > 0;
        const canScrollDown =
          listRef.current.scrollTop + listRef.current.clientHeight <
          listRef.current.scrollHeight - 1;
        if ((speed < 0 && !canScrollUp) || (speed > 0 && !canScrollDown)) {
          stopAutoScroll();
          return;
        }
        listRef.current.scrollTop += speed;
        autoScrollRef.current = requestAnimationFrame(step);
      };
      if (!autoScrollRef.current) {
        autoScrollRef.current = requestAnimationFrame(step);
      }
    },
    [stopAutoScroll],
  );

  const isInteractiveDisabled = disabled || readOnly;
  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex h-9 w-full min-w-0 items-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900/50 px-2.5 py-1 text-base md:text-[15px] transition-colors outline-none",
          "focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50 focus-within:bg-white",
          disabled && "opacity-50 pointer-events-none bg-muted",
          readOnly && "opacity-50 pointer-events-none bg-muted",
          open &&
            "border-ring dark:border-zinc-600 ring-3 ring-ring/50 bg-white",
        )}
        onMouseDown={(e) => {
          if (isInteractiveDisabled) return;
          if ((e.target as HTMLElement).closest("[data-clear-btn]")) return;

          if (!open) {
            e.preventDefault();
            setOpen(true);

            requestAnimationFrame(() => inputRef.current?.focus());
          }
        }}
        onClick={() => {
          if (!isInteractiveDisabled && !open) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <input
          ref={inputRef}
          value={open ? query : selected ? selected.label : ""}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            doSearch(v);
            if (!open) setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => {
            if (!isInteractiveDisabled) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={selected ? undefined : placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed w-full min-w-0"
          autoComplete="off"
        />
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              {value != null && value !== "" && (
                <button
                  type="button"
                  data-clear-btn
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleClear}
                  className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  tabIndex={-1}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </>
          )}
        </div>
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[9999] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden flex flex-col overscroll-contain"
            style={portalStyle}
            onWheel={(e) => e.stopPropagation()}
          >
            <div
              ref={listRef}
              onMouseMove={handleAutoScrollMove}
              onMouseLeave={stopAutoScroll}
              className="flex flex-col gap-1 overflow-y-auto p-1 overscroll-contain scroll-smooth"
              style={{ maxHeight }}
              onWheel={(e) => e.stopPropagation()}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                filtered.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const isHighlighted = idx === highlighted;
                  return (
                    <div
                      key={`${String(opt.value)}-${idx}`}
                      data-index={idx}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => {
                        if (autoScrollRef.current) return;
                        setHighlighted(idx);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(opt);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm cursor-pointer select-none",
                        isHighlighted && !isSelected
                          ? "bg-zinc-100 dark:bg-zinc-800"
                          : "",
                        isSelected
                          ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white font-medium"
                          : "text-foreground",
                      )}
                    >
                      {renderOption ? (
                        renderOption(opt, { isSelected, isHighlighted })
                      ) : (
                        <>
                          <span className="truncate">{opt.label}</span>
                          {isSelected && <Check className="h-4 w-4 shrink-0" />}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
