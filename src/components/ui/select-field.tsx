"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

import { cn } from "@/lib/cn";

const EMPTY_VALUE = "__none__";

export interface SelectOption {
  label: string;
  value: string | number | boolean;
}

export interface SelectOptGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectChangeData {
  value: string | number | boolean | undefined;
  label: string | undefined;
}

type SelectFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: ReactNode;
  description?: string;
  required?: boolean;
  placeholder?: string;
  loadingText?: string;
  containerClassName?: string;
  className?: string;
  options?: SelectOption[];
  groups?: SelectOptGroup[];
  disabled?: boolean;
  loading?: boolean;
  onChange?: (data: SelectChangeData) => void;
};

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description: _description,
  required,
  placeholder,
  loadingText = "Loading…",
  containerClassName,
  className,
  options,
  groups,
  disabled,
  loading,
  onChange,
}: SelectFieldProps<T>) {
  void _description;
  const allOptions: SelectOption[] = [
    ...(options ?? []),
    ...(groups?.flatMap((g) => g.options) ?? []),
  ];

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={containerClassName}>
          {label && (
            <FormLabel className="text-sm font-medium">
              {label}
              {required && <span className="ml-0.5 text-destructive">*</span>}
            </FormLabel>
          )}

          <FormControl>
            <div
              className={cn(
                "flex h-9 w-full min-w-0 items-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 focus-within:bg-white focus-within:border-zinc-400 dark:focus-within:border-zinc-500 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 transition-colors outline-none",
                (disabled || loading) && "bg-muted dark:bg-zinc-900/50",
              )}
            >
              <Select
                disabled={disabled || loading}
                onValueChange={(val) => {
                  if (val === EMPTY_VALUE) {
                    field.onChange(undefined);
                    onChange?.({ value: undefined, label: undefined });
                    return;
                  }
                  const original = allOptions.find(
                    (o) => String(o.value) === val,
                  );
                  const resolved = original ? original.value : val;
                  field.onChange(resolved);
                  onChange?.({ value: resolved, label: original?.label });
                }}
                value={
                  field.value !== undefined && field.value !== ""
                    ? String(field.value)
                    : EMPTY_VALUE
                }
              >
                <SelectTrigger
                  className={cn(
                    "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none bg-transparent h-9 px-2.5 py-1 text-base md:text-[15px]",
                    "w-full",
                    loading && "opacity-60 pointer-events-none",
                    className,
                  )}
                >
                  <SelectValue
                    placeholder={
                      loading ? loadingText : (placeholder ?? "Select")
                    }
                  />
                  {loading && (
                    <Loader2
                      size={14}
                      className="animate-spin text-muted-foreground ml-auto"
                    />
                  )}
                </SelectTrigger>

                <SelectContent className="p-1.5">
                  <SelectItem value={EMPTY_VALUE}>
                    {placeholder ?? "Select"}
                  </SelectItem>

                  {options?.map((opt) => (
                    <SelectItem
                      key={String(opt.value)}
                      value={String(opt.value)}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}

                  {groups?.map((group) => (
                    <div key={group.label}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {group.label}
                      </div>
                      {group.options.map((opt) => (
                        <SelectItem
                          key={String(opt.value)}
                          value={String(opt.value)}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
