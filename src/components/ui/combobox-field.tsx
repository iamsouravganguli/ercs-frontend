"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { ReactNode } from "react";

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
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  useComboboxAnchor,
} from "./combobox";

import { cn } from "@/lib/cn";


export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxOptionGroup {
  label: string;
  options: ComboboxOption[];
}

type ComboboxOptions = ComboboxOption[] | ComboboxOptionGroup[];

function isGrouped(options: ComboboxOptions): options is ComboboxOptionGroup[] {
  return options.length > 0 && "options" in (options[0] as object);
}

function flattenOptions(options: ComboboxOptions): ComboboxOption[] {
  return isGrouped(options)
    ? (options as ComboboxOptionGroup[]).flatMap((g) => g.options)
    : (options as ComboboxOption[]);
}


function OptionList({ options }: { options: ComboboxOptions }) {
  if (isGrouped(options)) {
    return (
      <>
        {(options as ComboboxOptionGroup[]).map((group, i) => (
          <div key={group.label}>
            {i > 0 && <ComboboxSeparator />}
            <ComboboxGroup>
              <ComboboxLabel>{group.label}</ComboboxLabel>
              {group.options.map((opt) => (
                <ComboboxItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {(options as ComboboxOption[]).map((opt, index) => (
        <ComboboxItem
          key={`${opt.value}-${index}`}
          value={opt.value}
          disabled={opt.disabled}
        >
          {opt.label}
        </ComboboxItem>
      ))}
    </>
  );
}


function LoadingSkeleton({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex flex-col gap-1 p-1">
      <p className="px-2 py-1.5 text-xs text-muted-foreground">{text}</p>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-8 animate-pulse rounded-md bg-muted"
          style={{ opacity: 1 - i * 0.2 }}
        />
      ))}
    </div>
  );
}


interface ComboboxFieldBaseProps {
  options: ComboboxOptions;
  placeholder?: string;
  emptyText?: string;
  loading?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  label?: ReactNode;
  description?: string;
  required?: boolean;
  containerClassName?: string;
  className?: string;
  clearable?: boolean;
  filterMode?: "client" | "server";
  onInputChange?: (value: string) => void;
}


export type ComboboxFieldProps<T extends FieldValues> =
  ComboboxFieldBaseProps & {
    control: Control<T>;
    name: Path<T>;
    onValueChange?: (value: string | null) => void;
  };

export function ComboboxField<T extends FieldValues>({
  control,
  name,
  options,
  placeholder = "Select…",
  emptyText = "No results found.",
  loading = false,
  isLoading = false,
  loadingText = "Loading…",
  disabled = false,
  label,
  description: _description,
  required,
  containerClassName,
  className,
  clearable = false,
  filterMode = "client",
  onInputChange,
  onValueChange,
}: ComboboxFieldProps<T>) {
  void _description;
  const showSkeleton = isLoading || loading;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={containerClassName}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}

          <FormControl>
            <div className={cn("flex w-full items-center", className)}>
              <div className="w-full">
                <Combobox
                  value={field.value ?? null}
                  onValueChange={(val) => {
                    field.onChange(val);
                    onValueChange?.(val);
                  }}
                  disabled={disabled}
                >
                  <ComboboxInput
                    placeholder={placeholder}
                    showClear={clearable}
                    disabled={disabled}
                    onBlur={field.onBlur}
                    onChange={
                      filterMode === "server"
                        ? (e) => onInputChange?.(e.target.value)
                        : undefined
                    }
                  />

                  <ComboboxContent>
                    <ComboboxList>
                      {showSkeleton ? (
                        <LoadingSkeleton text={loadingText} />
                      ) : (
                        <>
                          <ComboboxEmpty>{emptyText}</ComboboxEmpty>
                          <OptionList options={options} />
                        </>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            </div>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}


export type MultiComboboxFieldProps<T extends FieldValues> =
  ComboboxFieldBaseProps & {
    control: Control<T>;
    name: Path<T>;
    onValueChange?: (value: string[]) => void;
  };

export function MultiComboboxField<T extends FieldValues>({
  control,
  name,
  options,
  placeholder = "Select…",
  emptyText = "No results found.",
  loading = false,
  isLoading = false,
  loadingText = "Loading…",
  disabled = false,
  label,
  description: _description,
  required,
  containerClassName,
  className,
  filterMode = "client",
  onInputChange,
  onValueChange,
}: MultiComboboxFieldProps<T>) {
  void _description;
  const anchor = useComboboxAnchor();
  const showSkeleton = isLoading || loading;

  const labelMap = Object.fromEntries(
    flattenOptions(options).map((o) => [o.value, o.label]),
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value: string[] = field.value ?? [];

        return (
          <FormItem className={containerClassName}>
            {label && (
              <FormLabel>
                {label}
                {required && <span className="ml-1 text-destructive">*</span>}
              </FormLabel>
            )}

            <FormControl>
              <div
                className={cn(
                  "flex w-full items-center border rounded-md",
                  className,
                )}
              >
                <div className="w-full">
                  <Combobox<string, true>
                    value={value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      onValueChange?.(val);
                    }}
                    multiple
                    disabled={disabled}
                  >
                    <ComboboxChips ref={anchor}>
                      {value.map((v) => (
                        <ComboboxChip key={v}>{labelMap[v] ?? v}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput
                        placeholder={value.length ? "" : placeholder}
                        onChange={
                          filterMode === "server"
                            ? (e) =>
                                onInputChange?.(
                                  (e.target as HTMLInputElement).value,
                                )
                            : undefined
                        }
                      />
                    </ComboboxChips>

                    <ComboboxContent anchor={anchor}>
                      <ComboboxList>
                        {showSkeleton ? (
                          <LoadingSkeleton text={loadingText} />
                        ) : (
                          <>
                            <ComboboxEmpty>{emptyText}</ComboboxEmpty>
                            <OptionList options={options} />
                          </>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </div>
            </FormControl>

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
