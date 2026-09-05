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

type UsernameFieldAuthProps<T extends FieldValues> =
  InputHTMLAttributes<HTMLInputElement> & {
    control: Control<T>;
    name: Path<T>;
    label?: string;
    description?: string;
    required?: boolean;
    containerClassName?: string;
  };

function detectLoginType(value: string) {
  if (/^\d{10}$/.test(value)) return "mobile";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
  if (/^[a-zA-Z0-9_]+$/.test(value)) return "username";
  return "";
}

function UsernameFieldBody<T extends FieldValues>({
  field,
  label,
  required,
  placeholder,
  className,
  containerClassName,
  inputProps,
}: {

  field: any;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  containerClassName?: string;

  inputProps: any;
}) {
  const value = field.value || "";
  const type = detectLoginType(value);
  const isMobile = type === "mobile";
  const isEmail = type === "email";

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
            "focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50",
          )}
        >
          {isMobile && (
            <span className="flex shrink-0 items-center gap-1.5 self-stretch border-r border-slate-200 px-3 text-sm text-muted-foreground bg-muted/50 rounded-l-lg dark:bg-muted/10">
              <ReactCountryFlag
                countryCode="IN"
                svg
                style={{ width: "1.2em", height: "1.2em" }}
              />
              +91
            </span>
          )}

          <Input
            {...field}
            {...inputProps}
            value={value}
            required={required}
            onChange={(e) => {
              let v = e.target.value;
              if (isMobile) v = v.replace(/\D/g, "");
              else if (isEmail) v = v.trim().toLowerCase();
              else v = v.trim();
              field.onChange(v);
              inputProps.onChange?.(e);
            }}
            className={cn(
              "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none h-9 text-[15px] px-2.5",
              className,
            )}
            placeholder={placeholder}
            autoComplete="username"
            inputMode={isMobile ? "numeric" : "text"}
            pattern={isMobile ? "[0-9]*" : undefined}
            maxLength={isMobile ? 10 : undefined}
          />
        </div>
      </FormControl>

      <FormMessage />
    </FormItem>
  );
}

export function UsernameFieldAuth<T extends FieldValues>({
  control,
  name,
  label,
  description: _description,
  required,
  placeholder = "Enter mobile / email / username",
  className,
  containerClassName,
  ...inputProps
}: UsernameFieldAuthProps<T>) {
  void _description;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <UsernameFieldBody
          field={field}
          label={label}
          required={required}
          placeholder={placeholder}
          className={className}
          containerClassName={containerClassName}
          inputProps={inputProps}
        />
      )}
    />
  );
}
