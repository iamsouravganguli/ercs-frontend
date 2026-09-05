"use client";

import {
  Control,
  FieldValues,
  Path,
  PathValue,
  useFormContext,
} from "react-hook-form";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/cn";

type CaptchaFieldAuthProps<T extends FieldValues, K extends Path<T>> = {
  control: Control<T>;
  name: K;
  captchaSrc: string;
  onRefresh: () => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  imageErrorText?: string;
  debugText?: string;
  containerClassName?: string;
};

export function CaptchaFieldAuth<T extends FieldValues, K extends Path<T>>({
  control,
  name,
  captchaSrc,
  onRefresh,
  label = "Captcha",
  placeholder = "Enter captcha",
  required,
  imageErrorText = "Failed to load captcha",
  debugText,
  containerClassName,
}: CaptchaFieldAuthProps<T, K>) {
  const { setValue } = useFormContext<T>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);


  useEffect(() => {

    setLoading(true);
    setError(false);
  }, [captchaSrc]);

  function handleRefresh() {
    setLoading(true);
    setError(false);
    setValue(name, "" as PathValue<T, K>);
    onRefresh();
  }

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

          {}
          <div className="flex flex-col gap-2">
            {}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent">
                {loading && (
                  <div className="absolute inset-0 animate-pulse bg-muted" />
                )}
                {!error && captchaSrc ? (


                  <img
                    key={captchaSrc}
                    src={captchaSrc}
                    alt="captcha"
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setError(true);
                      setLoading(false);
                    }}
                    className={cn(
                      "block max-w-full h-auto object-contain transition-opacity duration-300",
                      loading ? "opacity-0" : "opacity-100",
                    )}
                    style={{ maxHeight: "48px" }}
                  />
                ) : (
                  <div className="flex items-center justify-center text-xs text-muted-foreground px-4 py-3 text-center min-h-[48px] min-w-[140px]">
                    {error ? imageErrorText : "Loading..."}
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                aria-label="Refresh captcha"
                disabled={loading}
                className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 bg-white hover:bg-zinc-50 focus-within:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 dark:border-zinc-700 hover:bg-muted shadow-none"
              >
                <RefreshCw
                  className={cn("h-4 w-4", loading && "animate-spin")}
                />
              </Button>
            </div>

            {}
            <FormControl>
              <div className="flex w-full items-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 focus-within:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 transition-colors focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50">
                <Input
                  {...field}
                  placeholder={placeholder}
                  autoComplete="off"
                  required={required}
                  disabled={loading}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                    field.onChange(v);
                  }}
                  className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none h-9 text-[15px] px-2.5 flex-1"
                />
              </div>
            </FormControl>
          </div>

          {debugText && (
            <p className="text-xs text-green-600 font-mono">Dev: {debugText}</p>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
