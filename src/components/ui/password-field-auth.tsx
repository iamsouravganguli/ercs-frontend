"use client";

import { useState } from "react";
import { Control, FieldValues, Path } from "react-hook-form";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

import { Input } from "./input";
import { cn } from "@/lib/cn";


function getStrengthBars(password: string): { bars: number; color: string } {
  if (!password) return { bars: 0, color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { bars: 1, color: "bg-red-500" };
  if (score === 2) return { bars: 2, color: "bg-yellow-500" };
  if (score === 3) return { bars: 3, color: "bg-blue-500" };
  return { bars: 4, color: "bg-green-500" };
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const { bars, color } = getStrengthBars(password);
  if (!password) return null;

  return (
    <div className="flex gap-1 mt-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-all duration-300",
            i < bars ? color : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}


type PasswordFieldAuthProps<T extends FieldValues> =
  InputHTMLAttributes<HTMLInputElement> & {
    control: Control<T>;
    name: Path<T>;
    label?: string;
    required?: boolean;
    showStrength?: boolean;
    forgotPasswordHref?: string;
    forgotPasswordText?: string;
    showForgotPassword?: boolean;
    containerClassName?: string;
    defaultShow?: boolean;
  };

export function PasswordFieldAuth<T extends FieldValues>({
  control,
  name,
  label,
  required,
  className,
  showStrength = false,
  forgotPasswordHref = "/forgot-password",
  forgotPasswordText = "Forgot password?",
  showForgotPassword = false,
  containerClassName,
  defaultShow = false,
  ...inputProps
}: PasswordFieldAuthProps<T>) {
  const [show, setShow] = useState(defaultShow);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={containerClassName}>
          <div className="flex items-center justify-between">
            {label && (
              <FormLabel className="text-sm font-medium">
                {label}
                {required && <span className="ml-0.5 text-destructive">*</span>}
              </FormLabel>
            )}
            {showForgotPassword && (
              <Link
                href={forgotPasswordHref}
                className="text-sm font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
              >
                {forgotPasswordText}
              </Link>
            )}
          </div>

          <FormControl>
            <div
              className={cn(
                "relative flex w-full items-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 focus-within:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 transition-colors",
                "focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50",
              )}
            >
              <Input
                {...field}
                {...inputProps}
                type={show ? "text" : "password"}
                required={required}
                autoComplete={inputProps.autoComplete ?? "current-password"}
                className={cn(
                  "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none h-9 text-[15px] px-2.5 pr-10",
                  className,
                )}
              />

              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormControl>

          {showStrength && (
            <PasswordStrengthMeter password={field.value ?? ""} />
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
