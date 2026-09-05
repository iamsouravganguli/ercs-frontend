"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { InputHTMLAttributes } from "react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

import { Input } from "./input";
import { cn } from "@/lib/cn";

type EmailFieldProps<T extends FieldValues> =
  InputHTMLAttributes<HTMLInputElement> & {
    control: Control<T>;
    name: Path<T>;
    label?: string;
    description?: string;
    required?: boolean;
    containerClassName?: string;
    readonly?: boolean;
  };

export function EmailField<T extends FieldValues>({
  control,
  name,
  label,
  description: _description,
  required,
  placeholder = "Enter your email address",
  className,
  containerClassName,
  readonly,
  ...inputProps
}: EmailFieldProps<T>) {
  void _description;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = field.value || "";

        return (
          <FormItem className={containerClassName}>
            {}
            {label && (
              <FormLabel className="text-sm font-medium">
                {label}
                {required && <span className="ml-0.5 text-destructive">*</span>}
              </FormLabel>
            )}

            <FormControl>
              <div
                className={cn(
                  "flex w-full items-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 focus-within:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 transition-colors",
                  !readonly &&
                    "focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50",
                  readonly && "bg-muted dark:bg-zinc-900/50",
                )}
              >
                <Input
                  {...field}
                  {...inputProps}
                  type="text"
                  value={value}
                  required={required}
                  readOnly={readonly}
                  aria-readonly={readonly}
                  onChange={(e) => {
                    if (readonly) return;
                    const v = e.target.value.trim().toLowerCase();
                    field.onChange(v);
                    inputProps.onChange?.(e);
                  }}
                  className={cn(
                    "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                    "h-9 text-[15px] px-2.5 placeholder:text-sm",
                    readonly &&
                      "text-muted-foreground cursor-default select-none",
                    className,
                  )}
                  placeholder={placeholder}
                  autoComplete="off"
                  inputMode="email"
                />
              </div>
            </FormControl>

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
