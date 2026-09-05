"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { InputHTMLAttributes, ReactNode, ReactElement } from "react";
import { cloneElement, isValidElement } from "react";
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

type ZipCodeFieldProps<T extends FieldValues = FieldValues> = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type" | "pattern" | "maxLength"
> & {
  control: Control<T>;
  name: Path<T>;
  label?: ReactNode;
  description?: string;
  required?: boolean;
  containerClassName?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fieldSize?: TextFieldSize;
  iconSize?: number;
  readonly?: boolean;
  maxDigits?: number;
  minDigits?: number;
  showDefaultIcon?: boolean;
};

export function ZipCodeField<T extends FieldValues = FieldValues>({
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
  fieldSize = "default",
  iconSize,
  readonly,
  maxDigits = 6,
  minDigits = 4,
  showDefaultIcon = false,
  ...inputProps
}: ZipCodeFieldProps<T>) {
  void _description;
  const s = sizeConfig[fieldSize];
  const finalIconSize = iconSize ?? s.iconSize;

  const resolvedIconLeft =
    iconLeft !== undefined ? iconLeft : showDefaultIcon ? <MapPin /> : null;

  const renderIcon = (icon?: ReactNode) => {
    if (!icon) return null;
    if (isValidElement(icon)) {
      return cloneElement(icon as ReactElement<{ size?: number }>, {
        size: finalIconSize,
      });
    }
    return icon;
  };

  const toDigitsOnly = (value: string): string =>
    value.replace(/\D/g, "").slice(0, maxDigits);

  return (
    <FormField
      control={control}
      name={name}
      rules={{
        validate: (value: string) => {
          if (!value || value.length === 0) {
            return required ? "This field is required" : true;
          }
          if (value.length < minDigits) {
            return `Must be at least ${minDigits} digits`;
          }
          if (value.length > maxDigits) {
            return `Must be at most ${maxDigits} digits`;
          }
          return true;
        },
      }}
      render={({ field }) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          field.onChange(toDigitsOnly(e.target.value));
        };

        return (
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

                  "flex w-full items-center rounded-lg border overflow-hidden border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 focus-within:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 transition-colors",
                  !readonly &&
                    "focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50",
                  readonly && "bg-muted dark:bg-zinc-900/50",
                )}
              >
                {resolvedIconLeft && (
                  <span
                    className={cn(
                      "flex shrink-0 items-center self-stretch border-r border-slate-200 text-muted-foreground",
                      s.iconWrapper,
                    )}
                  >
                    {renderIcon(resolvedIconLeft)}
                  </span>
                )}

                <Input
                  {...field}
                  {...inputProps}
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder={placeholder ?? "0".repeat(maxDigits)}
                  maxLength={maxDigits}
                  required={required}
                  readOnly={readonly}
                  aria-readonly={readonly}
                  value={field.value ?? ""}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    const allowed = [
                      "Backspace",
                      "Delete",
                      "Tab",
                      "Enter",
                      "Escape",
                      "ArrowLeft",
                      "ArrowRight",
                      "Home",
                      "End",
                    ];
                    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
                      e.preventDefault();
                    }
                    inputProps.onKeyDown?.(e);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    const digits = toDigitsOnly((field.value ?? "") + pasted);
                    field.onChange(digits);
                    inputProps.onPaste?.(e);
                  }}
                  className={cn(
                    "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                    s.input,
                    readonly &&
                      "text-muted-foreground cursor-default select-none",
                    className,
                  )}
                />

                {iconRight && (
                  <span
                    className={cn(
                      "flex shrink-0 items-center self-stretch border-l border-slate-200 text-muted-foreground",
                      s.iconWrapper,
                    )}
                  >
                    {renderIcon(iconRight)}
                  </span>
                )}
              </div>
            </FormControl>

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
