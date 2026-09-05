"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { InputHTMLAttributes, ReactNode } from "react";
import { MapPin } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

import { Input } from "./input";
import { cn } from "@/lib/cn";


type TextFieldSize = "sm" | "default" | "lg";

type SizeConfig = {
  input: string;
  iconWrapper: string;
  iconSize: number;
  infoSize: number;
};


const sizeConfig: Record<TextFieldSize, SizeConfig> = {
  sm: {
    input: "h-8 text-xs px-2",
    iconWrapper: "px-2",
    iconSize: 14,
    infoSize: 12,
  },
  default: {
    input: "h-9 text-sm px-3",
    iconWrapper: "px-3",
    iconSize: 16,
    infoSize: 14,
  },
  lg: {
    input: "h-11 text-base px-4",
    iconWrapper: "px-4",
    iconSize: 18,
    infoSize: 16,
  },
};


type LatLngFieldProps<T extends FieldValues = FieldValues> = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "placeholder"
> & {
  control: Control<T>;
  latName: Path<T>;
  lngName: Path<T>;
  label?: ReactNode;
  description?: string;
  required?: boolean;
  containerClassName?: string;
  fieldSize?: TextFieldSize;
  iconSize?: number;
  readonly?: boolean;
  latPlaceholder?: string;
  lngPlaceholder?: string;
  showDefaultIcon?: boolean;
};


export function LatLngField<T extends FieldValues = FieldValues>({
  control,
  latName,
  lngName,
  label,
  description: _description,
  required,
  className,
  containerClassName,
  fieldSize = "default",
  iconSize,
  readonly,
  latPlaceholder = "Latitude",
  lngPlaceholder = "Longitude",
  showDefaultIcon = false,
  ...inputProps
}: LatLngFieldProps<T>) {
  void _description;
  const s = sizeConfig[fieldSize];
  const finalIconSize = iconSize ?? s.iconSize;

  const toDecimal = (value: string): string =>
    value
      .replace(/[^0-9.\-]/g, "")
      .replace(/(?!^)-/g, "")
      .replace(/(\..*)\./g, "$1");

  return (
    <FormItem className={containerClassName}>
      {}
      {label && (
        <FormLabel className="text-sm font-medium">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </FormLabel>
      )}

      {}
      <div
        className={cn(
          "flex w-full items-center rounded-lg border overflow-hidden border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 focus-within:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 transition-colors",
          !readonly &&
            "focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50",
          readonly && "bg-muted dark:bg-zinc-900/50",
        )}
      >
        {}
        {showDefaultIcon && (
          <span
            className={cn(
              "flex shrink-0 items-center self-stretch border-r border-slate-200 text-muted-foreground",
              s.iconWrapper,
            )}
          >
            <MapPin size={finalIconSize} />
          </span>
        )}

        {}
        <FormField
          control={control}
          name={latName}
          rules={{
            validate: (value: string) => {
              if (!value && required) return "Latitude is required";
              const num = parseFloat(value);
              if (isNaN(num)) return "Invalid latitude";
              if (num < -90 || num > 90) return "Must be between -90 and 90";
              return true;
            },
          }}
          render={({ field }) => (
            <FormControl>
              <Input
                {...field}
                {...inputProps}
                type="text"
                inputMode="decimal"
                placeholder={latPlaceholder}
                readOnly={readonly}
                aria-readonly={readonly}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(toDecimal(e.target.value))}
                className={cn(
                  "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                  s.input,
                  readonly &&
                    "text-muted-foreground cursor-default select-none",
                  className,
                )}
              />
            </FormControl>
          )}
        />

        {}
        <span className="self-stretch border-l border-slate-200" />

        {}
        <FormField
          control={control}
          name={lngName}
          rules={{
            validate: (value: string) => {
              if (!value && required) return "Longitude is required";
              const num = parseFloat(value);
              if (isNaN(num)) return "Invalid longitude";
              if (num < -180 || num > 180)
                return "Must be between -180 and 180";
              return true;
            },
          }}
          render={({ field }) => (
            <FormControl>
              <Input
                {...field}
                {...inputProps}
                type="text"
                inputMode="decimal"
                placeholder={lngPlaceholder}
                readOnly={readonly}
                aria-readonly={readonly}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(toDecimal(e.target.value))}
                className={cn(
                  "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                  s.input,
                  readonly &&
                    "text-muted-foreground cursor-default select-none",
                  className,
                )}
              />
            </FormControl>
          )}
        />
      </div>

      {}
      <FormField
        control={control}
        name={latName}
        render={() => <FormMessage />}
      />
      <FormField
        control={control}
        name={lngName}
        render={() => <FormMessage />}
      />
    </FormItem>
  );
}
