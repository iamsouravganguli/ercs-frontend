"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { InputHTMLAttributes } from "react";
import ReactCountryFlag from "react-country-flag";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

import { Input } from "./input";
import { cn } from "@/lib/cn";

type PhoneFieldProps<T extends FieldValues> =
  InputHTMLAttributes<HTMLInputElement> & {
    control: Control<T>;
    name: Path<T>;
    label?: string;
    description?: string;
    required?: boolean;
    containerClassName?: string;
    readonly?: boolean;
  };

export function PhoneField<T extends FieldValues>({
  control,
  name,
  label,
  description: _description,
  required,
  placeholder = "Enter 10-digit mobile number",
  className,
  containerClassName,
  readonly,
  ...inputProps
}: PhoneFieldProps<T>) {
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
                {}
                <span className="flex shrink-0 items-center gap-1.5 self-stretch border-r border-slate-200 px-3 text-sm text-muted-foreground bg-muted/50 rounded-l-lg dark:bg-muted/10">
                  <ReactCountryFlag
                    countryCode="IN"
                    svg
                    style={{ width: "1.2em", height: "1.2em" }}
                  />
                  +91
                </span>

                <Input
                  {...field}
                  {...inputProps}
                  value={value}
                  required={required}
                  readOnly={readonly}
                  aria-readonly={readonly}
                  onChange={(e) => {
                    if (readonly) return;
                    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                    field.onChange(v);
                    inputProps.onChange?.(e);
                  }}
                  className={cn(
                    "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                    "h-9 text-[15px] px-2.5 placeholder:text-sm",
                    readonly &&
                      "text-muted-foreground cursor-default pointer-events-none select-none",
                    className,
                  )}
                  placeholder={placeholder}
                  autoComplete="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
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
