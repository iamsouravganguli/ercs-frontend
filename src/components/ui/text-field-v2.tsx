"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { InputHTMLAttributes, ReactNode, ReactElement } from "react";
import { cloneElement, isValidElement } from "react";
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
    input: "h-8 text-xs px-2 placeholder:text-xs",
    iconWrapper: "px-2",
    iconSize: 14,
    infoSize: 12,
  },
  default: {
    input: "h-9 text-[15px] px-2.5 placeholder:text-sm",
    iconWrapper: "px-3",
    iconSize: 16,
    infoSize: 14,
  },
  lg: {
    input: "h-11 text-base px-4 placeholder:text-base",
    iconWrapper: "px-4",
    iconSize: 18,
    infoSize: 16,
  },
};

type TextFieldProps<T extends FieldValues = FieldValues> = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
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
};

export function TextFieldV2<T extends FieldValues = FieldValues>({
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
  ...inputProps
}: TextFieldProps<T>) {
  void _description;
  const s = sizeConfig[fieldSize];
  const finalIconSize = iconSize ?? s.iconSize;

  const renderIcon = (icon?: ReactNode) => {
    if (!icon) return null;
    if (isValidElement(icon)) {
      return cloneElement(icon as ReactElement<{ size?: number }>, {
        size: finalIconSize,
      });
    }
    return icon;
  };

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

          {}
          <FormControl>
            <div
              className={cn(

                "flex w-full h-9 items-center rounded-lg border overflow-hidden border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 focus-within:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 transition-colors",
                !readonly &&
                  "focus-within:border-ring dark:focus-within:border-zinc-600 focus-within:ring-3 focus-within:ring-ring/50",
                readonly && "bg-muted dark:bg-zinc-900/50",
              )}
            >
              {}
              {iconLeft && (
                <span
                  className={cn(
                    "flex shrink-0 items-center self-stretch border-r border-slate-200 text-muted-foreground",
                    s.iconWrapper,
                  )}
                >
                  {renderIcon(iconLeft)}
                </span>
              )}

              {}
              <Input
                {...field}
                value={field.value ?? ""}
                {...inputProps}
                placeholder={placeholder}
                required={required}
                readOnly={readonly}
                aria-readonly={readonly}
                className={cn(
                  "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                  s.input,
                  readonly &&
                    "text-muted-foreground cursor-default select-none",
                  className,
                )}
              />

              {}
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

          {}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
