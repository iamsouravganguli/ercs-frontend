"use client";

import { Control, FieldValues, Path, useWatch } from "react-hook-form";
import type { ReactNode } from "react";
import { Loader2, X, ChevronDown, Search } from "lucide-react";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
  useId,
} from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { cn } from "@/lib/cn";
import { createPortal } from "react-dom";


export interface AutocompleteOption {
  label: string;
  value: string | number;
  [key: string]: unknown;
}

type MultiAutocompleteFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: ReactNode;
  description?: string;
  required?: boolean;
  placeholder?: string;
  loadingText?: string;
  containerClassName?: string;
  className?: string;
  options?: AutocompleteOption[];
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  emptyText?: string;

  maxDisplay?: number;
  onSearch?: (query: string) => void | Promise<void>;
  searchDebounceMs?: number;
  onChange?: (values: (string | number)[]) => void;
  renderOption?: (option: AutocompleteOption, checked: boolean) => ReactNode;

  placement?:
    | "auto"
    | "top"
    | "bottom"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

  container?: HTMLElement | null;
};


export type PopupPlacement =
  | "auto"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

type ResolvedPopupStyle = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width: number;
  maxHeight: number;
};

function dedup(opts: AutocompleteOption[]): AutocompleteOption[] {
  return opts.filter(
    (o, i, self) => i === self.findIndex((x) => x.value === o.value),
  );
}


function resolvePopupPlacement(
  triggerEl: HTMLElement,
  popupMaxH: number,
  placement: PopupPlacement = "auto",
  gap = 4,
): ResolvedPopupStyle {
  const rect = triggerEl.getBoundingClientRect();
  const viewportH = window.innerHeight;
  const viewportW = window.innerWidth;

  const spaceBelow = viewportH - rect.bottom - gap;
  const spaceAbove = rect.top - gap;


  const openUp =
    placement === "auto"
      ? spaceBelow < popupMaxH && spaceAbove > spaceBelow
      : placement.startsWith("top");


  const alignRight = placement === "top-right" || placement === "bottom-right";

  const vert: Pick<ResolvedPopupStyle, "top" | "bottom" | "maxHeight"> = openUp
    ? {
        bottom: viewportH - rect.top + gap,
        maxHeight: Math.min(popupMaxH, spaceAbove),
      }
    : { top: rect.bottom + gap, maxHeight: Math.min(popupMaxH, spaceBelow) };

  const horiz: Pick<ResolvedPopupStyle, "left" | "right"> = alignRight
    ? { right: viewportW - rect.right }
    : { left: rect.left };

  return { ...vert, ...horiz, width: rect.width };
}


export function MultiAutocompleteField<T extends FieldValues>({
  control,
  name,
  label,
  description: _description,
  required,
  placeholder = "Select…",
  loadingText = "Loading…",
  containerClassName,
  className,
  options = [],
  disabled,
  readonly,
  loading,
  emptyText = "No results found.",
  maxDisplay = 2,
  onSearch,
  searchDebounceMs = 300,
  onChange,
  renderOption,
  placement = "auto",
  container,
}: MultiAutocompleteFieldProps<T>) {
  void _description;
  const serverSide = !!onSearch;
  const listboxId = useId();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);


  const POPUP_MAX_H = 300;
  const [popupStyle, setPopupStyle] = useState<ResolvedPopupStyle | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const chipsContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchGen = useRef(0);
  const [dynamicMaxDisplay, setDynamicMaxDisplay] = useState(maxDisplay);

  const optionCache = useRef<Map<string | number, AutocompleteOption>>(
    new Map(),
  );


  useEffect(() => {
    for (const opt of options) optionCache.current.set(opt.value, opt);
  }, [options]);

  const uniqueOptions = useMemo(() => dedup(options), [options]);

  const filteredOptions = useMemo(
    () =>
      serverSide
        ? uniqueOptions
        : query.trim() === ""
          ? uniqueOptions
          : uniqueOptions.filter((o) =>
              o.label.toLowerCase().includes(query.toLowerCase()),
            ),
    [serverSide, uniqueOptions, query],
  );

  const watchedValue = useWatch({ control, name }) as unknown as
    | (string | number)[]
    | undefined;
  const watchedSelected = useMemo(
    () => (Array.isArray(watchedValue) ? watchedValue : []),
    [watchedValue],
  );


  useLayoutEffect(() => {
    const el = chipsContainerRef.current;
    const triggerEl = triggerRef.current;
    if (!el || !triggerEl) return;
    const update = () => {
      const containerWidth = el.clientWidth;
      if (containerWidth === 0) return;
      const labelMap = new Map<string, string>();
      for (const opt of uniqueOptions)
        labelMap.set(String(opt.value), opt.label);
      for (const [k, v] of optionCache.current.entries()) {
        if (!labelMap.has(String(k))) labelMap.set(String(k), String(v.label));
      }
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setDynamicMaxDisplay(maxDisplay);
        return;
      }
      ctx.font = "500 12px ui-sans-serif, system-ui, sans-serif";
      const chipPadding = 28;
      const gap = 6;
      const extraBadge = 32;
      let used = 0;
      let count = 0;
      for (let i = 0; i < watchedSelected.length; i++) {
        const val = watchedSelected[i];
        const label = labelMap.get(String(val)) ?? String(val);
        const textW = ctx.measureText(label).width;
        const chipW = Math.min(textW + chipPadding, 112);
        const willOverflow = i < watchedSelected.length - 1;
        const reserve = willOverflow ? extraBadge + gap : 0;
        if (used + chipW + (count > 0 ? gap : 0) + reserve > containerWidth)
          break;
        used += chipW + (count > 0 ? gap : 0);
        count++;
      }
      if (count === 0 && watchedSelected.length > 0 && containerWidth > 60)
        count = 1;
      setDynamicMaxDisplay(count);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    ro.observe(triggerEl);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [watchedSelected, uniqueOptions, maxDisplay]);


  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    setPopupStyle(
      resolvePopupPlacement(triggerRef.current, POPUP_MAX_H, placement),
    );
  }, [placement]);

  useEffect(() => {
    if (!open) return;
    updatePosition();


    window.addEventListener("scroll", updatePosition, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", updatePosition, { passive: true });
    return () => {
      window.removeEventListener("scroll", updatePosition, { capture: true });
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);


  const fireSearch = useCallback(
    (q: string) => {
      if (!onSearch) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      setSearching(true);
      const gen = ++searchGen.current;
      debounceTimer.current = setTimeout(async () => {
        try {
          await onSearch(q);
        } finally {
          if (searchGen.current === gen) setSearching(false);
        }
      }, searchDebounceMs);
    },
    [onSearch, searchDebounceMs],
  );


  useEffect(() => {
    if (!open || !serverSide) return;
    const t = setTimeout(() => {
      fireSearch(query);
    }, 0);
    return () => clearTimeout(t);

  }, [open]);


  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !triggerRef.current?.contains(t) &&
        !dropdownRef.current?.contains(t)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);


  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);


  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (serverSide) fireSearch(val);
  };

  const clearQuery = () => {
    setQuery("");
    if (serverSide) fireSearch("");
    inputRef.current?.focus();
  };

  const handleToggle = (
    val: string | number,
    current: (string | number)[],
    fieldOnChange: (v: (string | number)[]) => void,
  ) => {
    if (readonly) return;
    const next = current.includes(val)
      ? current.filter((v) => v !== val)
      : [...current, val];
    fieldOnChange(next);
    onChange?.(next);
  };

  const removeChip = (
    val: string | number,
    current: (string | number)[],
    fieldOnChange: (v: (string | number)[]) => void,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (readonly) return;
    const next = current.filter((v) => v !== val);
    fieldOnChange(next);
    onChange?.(next);
  };

  const clearAll = (
    fieldOnChange: (v: (string | number)[]) => void,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (readonly) return;
    fieldOnChange([]);
    onChange?.([]);
  };


  const renderDropdown = (
    selectedValues: (string | number)[],
    fieldOnChange: (v: (string | number)[]) => void,
  ) => {
    if (!popupStyle) return null;

    const dropdown = (
      <div
        ref={dropdownRef}
        id={listboxId}
        role="listbox"
        aria-multiselectable="true"
        className={cn(
          "z-[9999] fixed pointer-events-auto",
          "rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg",
          "flex flex-col overflow-hidden",
        )}
        style={{
          top: popupStyle.top,
          bottom: popupStyle.bottom,
          left: popupStyle.left,
          width: popupStyle.width,
          maxHeight: popupStyle.maxHeight,
        }}
      >
        {}
        <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 px-2.5 py-2 shrink-0">
          {searching ? (
            <Loader2
              size={13}
              className="shrink-0 animate-spin text-muted-foreground"
            />
          ) : (
            <Search size={13} className="shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search…"
            value={query}
            onChange={handleQueryChange}
          />
          {query && (
            <button
              type="button"
              tabIndex={-1}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                clearQuery();
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {}
        <ul className="flex flex-col gap-1 overflow-y-auto p-1 flex-1 min-h-0 max-h-60">
          {searching && filteredOptions.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 size={13} className="animate-spin" />
              Searching…
            </li>
          ) : filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {emptyText}
            </li>
          ) : (
            filteredOptions.map((opt, index) => {
              const checked = selectedValues.includes(opt.value);
              return (
                <li
                  key={`${String(opt.value)}-${index}`}
                  role="option"
                  aria-selected={checked}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-sm select-none transition-colors border border-transparent",
                    checked
                      ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 font-medium border-zinc-300 dark:border-zinc-600"
                      : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50",
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleToggle(opt.value, selectedValues, fieldOnChange);
                  }}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center mt-1",
                      "rounded border transition-colors",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800",
                    )}
                    aria-hidden="true"
                  >
                    {checked && (
                      <svg viewBox="0 0 12 12" fill="none" className="size-3">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {renderOption ? renderOption(opt, checked) : opt.label}
                </li>
              );
            })
          )}
        </ul>

        {}
        {selectedValues.length > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 shrink-0">
            <span className="text-xs text-muted-foreground">
              {selectedValues.length} selected
            </span>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                clearAll(fieldOnChange, e as unknown as React.MouseEvent);
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    );


    const portalTarget =
      container ?? (typeof document !== "undefined" ? document.body : null);
    return portalTarget ? createPortal(dropdown, portalTarget) : null;
  };


  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selectedValues: (string | number)[] = Array.isArray(field.value)
          ? field.value
          : [];

        const selectedOptions = selectedValues
          .map(
            (v) =>
              optionCache.current.get(v) ??
              uniqueOptions.find((o) => o.value === v),
          )
          .filter(Boolean) as AutocompleteOption[];

        const effectiveMax = dynamicMaxDisplay ?? maxDisplay;
        const displayChips = selectedOptions.slice(0, effectiveMax);
        const extraCount = selectedOptions.length - displayChips.length;
        const isDisabled = disabled || loading;

        return (
          <FormItem className={containerClassName}>
            {label && (
              <FormLabel className="text-sm font-medium">
                {label}
                {required && <span className="ml-0.5 text-destructive">*</span>}
              </FormLabel>
            )}

            <div className="flex items-center gap-2 w-full">
              <FormControl>
                {}
                <div className="relative w-full">
                  {}
                  <div
                    ref={triggerRef}
                    role="combobox"
                    tabIndex={isDisabled || readonly ? -1 : 0}
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    aria-controls={listboxId}
                    className={cn(
                      "flex h-9 w-full min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900/50 px-2.5 py-1 text-sm transition-colors outline-none",
                      "focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50 focus-within:bg-white",
                      isDisabled && "opacity-50 pointer-events-none bg-muted",
                      readonly &&
                        "opacity-80 bg-zinc-50 dark:bg-zinc-800/50 pointer-events-none",
                      open &&
                        "border-ring dark:border-zinc-600 ring-3 ring-ring/50 bg-white",
                      className,
                    )}
                    onClick={() => {
                      if (isDisabled || readonly) return;
                      setOpen((v) => !v);
                    }}
                  >
                    <div
                      ref={chipsContainerRef}
                      className="flex flex-1 min-w-0 items-center gap-1.5 overflow-hidden flex-nowrap"
                    >
                      {displayChips.map((opt) => (
                        <span
                          key={String(opt.value)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 shrink-0",
                            "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium",
                            "border border-zinc-200 dark:border-zinc-700 max-w-28",
                          )}
                        >
                          <span className="truncate max-w-20">{opt.label}</span>
                          {!readonly && (
                            <button
                              type="button"
                              tabIndex={-1}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) =>
                                removeChip(
                                  opt.value,
                                  selectedValues,
                                  field.onChange,
                                  e,
                                )
                              }
                            >
                              <X size={10} />
                            </button>
                          )}
                        </span>
                      ))}

                      {extraCount > 0 && (
                        <span className="text-xs text-muted-foreground px-1 whitespace-nowrap shrink-0">
                          +{extraCount}
                        </span>
                      )}

                      {selectedValues.length === 0 && (
                        <span className="text-muted-foreground select-none truncate">
                          {loading ? loadingText : placeholder}
                        </span>
                      )}
                    </div>

                    <span className="flex items-center gap-1 pl-1 shrink-0">
                      {loading && (
                        <Loader2
                          size={13}
                          className="animate-spin text-muted-foreground"
                        />
                      )}
                      {!readonly && selectedValues.length > 0 && !loading && (
                        <button
                          type="button"
                          tabIndex={-1}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => clearAll(field.onChange, e)}
                        >
                          <X size={13} />
                        </button>
                      )}
                      <ChevronDown
                        size={14}
                        className={cn(
                          "text-muted-foreground transition-transform duration-150",
                          open && "rotate-180",
                        )}
                      />
                    </span>
                  </div>

                  {}
                  {open &&
                    !readonly &&
                    renderDropdown(selectedValues, field.onChange)}
                </div>
              </FormControl>
            </div>

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
