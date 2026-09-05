"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { TextareaHTMLAttributes, ReactNode } from "react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

import { Textarea } from "./textarea";
import { cn } from "@/lib/cn";

type TextareaFieldProps<T extends FieldValues> =
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    control: Control<T>;
    name: Path<T>;
    label?: ReactNode;
    description?: string;
    required?: boolean;
    containerClassName?: string;
    readonly?: boolean;
  };

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description: _description,
  required,
  placeholder,
  className,
  containerClassName,
  readonly,
  ...textareaProps
}: TextareaFieldProps<T>) {
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
                "flex w-full items-start rounded-lg border overflow-hidden border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 focus-within:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 transition-colors",
                !readonly &&
                  "focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50",
                readonly && "bg-muted dark:bg-zinc-900/50",
              )}
            >
              <Textarea
                {...field}
                {...textareaProps}
                placeholder={placeholder}
                required={required}
                readOnly={readonly}
                aria-readonly={readonly}
                className={cn(
                  "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                  "min-h-16 w-full resize-none overflow-hidden wrap-break-word break-all whitespace-pre-wrap bg-transparent px-3 py-2 text-sm",
                  readonly &&
                    "text-muted-foreground cursor-default pointer-events-none select-none",
                  className,
                )}
              />
            </div>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
