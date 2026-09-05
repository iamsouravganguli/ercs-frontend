"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { InputHTMLAttributes, ReactNode } from "react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

import { Input } from "./input";
import { cn } from "@/lib/cn";

type TextFieldProps<T extends FieldValues> =
  InputHTMLAttributes<HTMLInputElement> & {
    control: Control<T>;
    name: Path<T>;
    label?: ReactNode;
    description?: string;
    required?: boolean;
    containerClassName?: string;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    readonly?: boolean;
  };

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description: _description,
  required,
  placeholder,
  className,
  containerClassName,
  iconLeft,
  iconRight,
  readonly,
  ...inputProps
}: TextFieldProps<T>) {
  void _description;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
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
              {iconLeft && (
                <span className="flex shrink-0 items-center self-stretch border-r border-slate-200 px-3 text-muted-foreground">
                  {iconLeft}
                </span>
              )}

              <Input
                {...field}
                {...inputProps}
                placeholder={placeholder}
                required={required}
                readOnly={readonly}
                aria-readonly={readonly}
                className={cn(
                  "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                  "h-9 text-[15px] px-2.5",
                  readonly &&
                    "text-muted-foreground cursor-default pointer-events-none select-none",
                  className,
                )}
              />

              {}
              {iconRight && (
                <span className="flex shrink-0 items-center self-stretch border-l border-slate-200 px-3 text-muted-foreground">
                  {iconRight}
                </span>
              )}
            </div>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
