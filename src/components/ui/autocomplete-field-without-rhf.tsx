"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "./combobox";
import { cn } from "@/lib/cn";

export interface AutocompleteOption {
  label: string;
  value: string | number;
  [key: string]: unknown;
}

type AutocompleteFieldWithoutRHFProps = {
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
  searchable?: boolean;
  allowClear?: boolean;
  debounceMs?: number;
  value?: string | number | null;
  onChange?: (value: string | number | null) => void;
  onSearch?: (query: string) => void;
  onAutocomplete?: (
    data: { label: string; value: string | number } & Record<string, unknown>,
  ) => void;
  renderOption?: (option: AutocompleteOption) => ReactNode;
  renderValue?: (option: AutocompleteOption | undefined) => ReactNode;
  container?: HTMLElement | null;
  error?: string;
};

export function AutocompleteFieldWithoutRHF({
  label,
  description: _description,
  required,
  placeholder,
  loadingText = "Loading…",
  containerClassName,
  className,
  options = [],
  disabled,
  readonly,
  loading,
  emptyText = "No results found.",
  searchable = true,
  allowClear = false,
  debounceMs = 500,
  value,
  onChange,
  onSearch,
  onAutocomplete,
  renderOption,
  renderValue,
  container,
  error,
}: AutocompleteFieldWithoutRHFProps) {
  void _description;
  const [query, setQuery] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (val: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => onSearch?.(val), debounceMs);
    },
    [onSearch, debounceMs],
  );

  const uniqueOptions = options.filter(
    (opt, index, self) =>
      index === self.findIndex((o) => String(o.value) === String(opt.value)),
  );

  const filteredOptions = onSearch
    ? uniqueOptions
    : query.trim() === ""
      ? uniqueOptions
      : uniqueOptions.filter((opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase()),
        );

  const selectedOption = uniqueOptions.find(
    (o) => String(o.value) === String(value),
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readonly) return;
    const val = e.target.value;
    setQuery(val);
    if (onSearch) debouncedSearch(val);
  };

  return (
    <div
      className={cn(
        label ? "flex flex-col gap-1.5" : "w-full",
        containerClassName,
      )}
    >
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}

      <div className="flex items-center gap-2 w-full">
        <Combobox<string | number | null>
          value={value ?? null}
          onValueChange={(val) => {
            if (readonly) return;
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            onChange?.(val);
            setQuery("");
            const option = uniqueOptions.find(
              (o) => String(o.value) === String(val),
            );
            if (option) onAutocomplete?.({ ...option });
          }}
          disabled={disabled || loading}
        >
          <ComboboxInput
            className={cn(
              loading && "opacity-60 pointer-events-none",
              readonly &&
                "bg-muted text-muted-foreground cursor-default pointer-events-none select-none",
              error && "border-destructive ring-destructive",
              className,
            )}
            placeholder={
              !query && selectedOption
                ? undefined
                : loading
                  ? loadingText
                  : (placeholder ?? "Select")
            }
            showClear={allowClear && !readonly && !!value}
            disabled={disabled || loading}
            onChange={searchable && !readonly ? handleInputChange : undefined}
            value={
              query || (selectedOption ? String(selectedOption.label) : "")
            }
            readOnly={readonly}
            aria-readonly={readonly}
            aria-invalid={!!error}
          />
          {renderValue && selectedOption && !query && (
            <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm">
              {renderValue(selectedOption)}
            </div>
          )}
          {loading && (
            <Loader2
              size={14}
              className="animate-spin text-muted-foreground -ml-8 z-10 pointer-events-none"
            />
          )}
          {!readonly && (
            <ComboboxContent className="p-1.5" container={container}>
              <ComboboxList className="py-4">
                {filteredOptions.length === 0 ? (
                  <ComboboxEmpty>{emptyText}</ComboboxEmpty>
                ) : (
                  filteredOptions.map((opt, index) => (
                    <ComboboxItem
                      key={`${String(opt.value)}-${index}`}
                      value={opt.value}
                    >
                      {renderOption ? renderOption(opt) : opt.label}
                    </ComboboxItem>
                  ))
                )}
              </ComboboxList>
            </ComboboxContent>
          )}
        </Combobox>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
