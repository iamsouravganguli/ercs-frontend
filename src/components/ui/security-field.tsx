"use client";

import * as React from "react";
import { Control, FieldValues, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "./form";
import { cn } from "@/lib/cn";

type SecurityFieldProps<T extends FieldValues> = {
  control?: Control<T>;
  name?: Path<T>;
  value?: string;
  onChange?: (val: string) => void;
  error?: string;
  autoSubmit?: boolean;
  onComplete?: (val: string) => void;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
};

function sanitizeOtp(val: string) {
  return val.replace(/\D/g, "").slice(0, 6);
}

function SecurityFieldInner({
  value,
  onChange,
  onComplete,
  disabled,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!autoFocus) return;
    const t1 = setTimeout(() => {
      const el = containerRef.current?.querySelector(
        "input",
      ) as HTMLInputElement | null;
      el?.focus();
    }, 100);
    return () => clearTimeout(t1);
  }, [autoFocus]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col items-center gap-2 w-full max-w-full overflow-hidden",
        className,
      )}
    >
      <div className="w-full max-w-[320px] sm:max-w-85 mx-auto flex justify-center gap-1.5 sm:gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value?.[i] ?? ""}
            onChange={(e) => {
              const raw = e.target.value;

              const sanitized = raw.replace(/\D/g, "");
              if (sanitized.length > 1) {
                const pasted = sanitized.slice(0, 6);
                onChange(pasted);
                if (pasted.length === 6 && onComplete && !disabled)
                  onComplete(pasted);
                requestAnimationFrame(() => {
                  const inputs =
                    containerRef.current?.querySelectorAll("input");
                  const targetIdx = Math.min(pasted.length, 5);
                  (inputs?.[targetIdx] as HTMLInputElement | null)?.focus();
                });
                return;
              }
              const v = sanitized.slice(-1);
              if (!v && value?.[i]) {
                const next = (value ?? "").split("");
                next[i] = "";
                onChange(next.join(""));
                requestAnimationFrame(() => {
                  const prev = containerRef.current?.querySelectorAll("input")[
                    i - 1
                  ] as HTMLInputElement | null;
                  prev?.focus();
                });
                return;
              }
              if (v) {
                const next = (value ?? "").padEnd(6, " ").split("");
                next[i] = v;
                const clean = next.join("").replace(/\s/g, "").slice(0, 6);
                onChange(clean);
                if (clean.length === 6 && onComplete && !disabled)
                  onComplete(clean);
                requestAnimationFrame(() => {
                  const nextEl = containerRef.current?.querySelectorAll(
                    "input",
                  )[i + 1] as HTMLInputElement | null;
                  nextEl?.focus();
                });
              } else if (!v && !value?.[i]) {

                requestAnimationFrame(() => {
                  const prev = containerRef.current?.querySelectorAll("input")[
                    i - 1
                  ] as HTMLInputElement | null;
                  prev?.focus();
                });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !value?.[i]) {
                const prev = containerRef.current?.querySelectorAll("input")[
                  i - 1
                ] as HTMLInputElement | null;
                prev?.focus();
              }
              if (e.key === "ArrowLeft") {
                const prev = containerRef.current?.querySelectorAll("input")[
                  i - 1
                ] as HTMLInputElement | null;
                prev?.focus();
              }
              if (e.key === "ArrowRight") {
                const next = containerRef.current?.querySelectorAll("input")[
                  i + 1
                ] as HTMLInputElement | null;
                next?.focus();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = sanitizeOtp(e.clipboardData.getData("text"));
              onChange(pasted);
              if (pasted.length === 6 && onComplete && !disabled)
                onComplete(pasted);
              const last = containerRef.current?.querySelectorAll(
                "input",
              )[5] as HTMLInputElement | null;
              last?.focus();
            }}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            className="h-11 w-11 sm:h-11 sm:w-11 text-center text-base font-semibold rounded-xl border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all flex-1 min-w-0 max-w-12"
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Paste or type the 6-digit code. Auto-verifies on complete.
      </p>
    </div>
  );
}

export function SecurityField<T extends FieldValues>({
  control,
  name,
  value,
  onChange,
  error,
  autoSubmit,
  onComplete,
  disabled,
  className,
  autoFocus,
}: SecurityFieldProps<T>) {

  if (control && name) {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <FormItem className="flex flex-col items-center">
            <FormControl>
              <SecurityFieldInner
                value={field.value ?? value ?? ""}
                onChange={(v) => {
                  field.onChange(v);
                  onChange?.(v);
                }}
                onComplete={autoSubmit ? onComplete : undefined}
                disabled={disabled}
                className={className}
                autoFocus={autoFocus}
              />
            </FormControl>
            <FormMessage>{error ?? fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
    );
  }


  return (
    <div className="flex flex-col items-center gap-1">
      <SecurityFieldInner
        value={value ?? ""}
        onChange={onChange ?? (() => {})}
        onComplete={autoSubmit ? onComplete : undefined}
        disabled={disabled}
        className={className}
        autoFocus={autoFocus}
      />
      {error && (
        <p className="text-destructive text-xs bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
          {error}
        </p>
      )}
    </div>
  );
}
