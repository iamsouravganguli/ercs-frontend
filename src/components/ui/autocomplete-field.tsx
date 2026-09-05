"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
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

type AutocompleteFieldProps<T extends FieldValues> = {
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
  searchable?: boolean;
  debounceMs?: number;
  onSearch?: (query: string) => void;
  onAutocomplete?: (
    data: { label: string; value: string | number } & Record<string, unknown>,
  ) => void;
  renderOption?: (option: AutocompleteOption) => ReactNode;
  renderValue?: (option: AutocompleteOption | undefined) => ReactNode;
  container?: HTMLElement | null;
};

export function AutocompleteField<T extends FieldValues>({
  control,
  name,
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
  debounceMs = 500,
  onSearch,
  onAutocomplete,
  renderOption,
  renderValue,
  container,
}: AutocompleteFieldProps<T>) {
  void _description;
  const [query, setQuery] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        onSearch?.(value);
      }, debounceMs);
    },
    [onSearch, debounceMs],
  );

  const uniqueOptions = options.filter(
    (opt, index, self) =>
      index === self.findIndex((o) => o.value === opt.value),
  );

  const filteredOptions = onSearch
    ? uniqueOptions
    : query.trim() === ""
      ? uniqueOptions
      : uniqueOptions.filter((opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase()),
        );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readonly) return;
    const val = e.target.value;
    setQuery(val);


    if (onSearch) {
      debouncedSearch(val);
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selectedOption = uniqueOptions.find(
          (o) => o.value === field.value,
        );

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
                <Combobox
                  value={field.value ?? null}
                  onValueChange={(val) => {
                    if (readonly) return;

                    if (debounceTimer.current) {
                      clearTimeout(debounceTimer.current);
                    }
                    field.onChange(val);
                    setQuery("");
                    const option = uniqueOptions.find((o) => o.value === val);
                    if (option) {
                      onAutocomplete?.({ ...option });
                    }
                  }}
                  disabled={disabled || loading}
                >
                  <ComboboxInput
                    className={cn(
                      loading && "opacity-60 pointer-events-none",
                      readonly &&
                        "bg-muted text-muted-foreground cursor-default pointer-events-none select-none",
                      className,
                    )}
                    placeholder={
                      !query && selectedOption
                        ? undefined
                        : loading
                          ? loadingText
                          : (placeholder ?? "Select")
                    }
                    showClear={!readonly && !!field.value}
                    disabled={disabled || loading}
                    onChange={
                      searchable && !readonly ? handleInputChange : undefined
                    }
                    value={
                      searchable
                        ? query || (selectedOption ? selectedOption.label : "")
                        : undefined
                    }
                    readOnly={readonly}
                    aria-readonly={readonly}
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
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
