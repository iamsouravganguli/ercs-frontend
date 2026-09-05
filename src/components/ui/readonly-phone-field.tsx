"use client";

import type { ReactNode } from "react";
import ReactCountryFlag from "react-country-flag";

import { cn } from "@/lib/cn";
import { Input } from "./input";
import { Label } from "./label";

interface ReadonlyPhoneFieldProps {
  value?: string;
  label?: ReactNode;
  description?: string;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
}

export function ReadonlyPhoneField({
  label,
  description: _description,
  placeholder = "Enter 10-digit mobile number",
  className,
  containerClassName,
  value,
}: ReadonlyPhoneFieldProps) {
  void _description;
  return (
    <div className={cn("space-y-2", containerClassName)}>
      {}
      {label && <Label className="text-sm font-medium">{label}</Label>}

      <div
        className={cn(
          "flex w-full items-center rounded-lg bg-background overflow-hidden",
          "border border-input ring-offset-background",
        )}
      >
        {}
        <span className="flex shrink-0 items-center gap-1.5 self-stretch border-r border-input px-3 text-sm text-muted-foreground bg-muted">
          <ReactCountryFlag
            countryCode="IN"
            svg
            style={{ width: "1.2em", height: "1.2em" }}
          />
          +91
        </span>

        <Input
          value={value ?? ""}
          placeholder={placeholder}
          readOnly
          autoComplete="tel"
          inputMode="numeric"
          className={cn(
            "h-9 text-sm px-3 placeholder:text-sm border-0 shadow-none",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "cursor-default read-only:bg-muted/50 read-only:text-muted-foreground",
            className,
          )}
        />
      </div>
    </div>
  );
}
