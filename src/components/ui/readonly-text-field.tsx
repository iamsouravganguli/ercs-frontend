"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Input } from "./input";
import { Label } from "./label";

interface ReadonlyTextFieldProps {
  value?: string;
  label?: ReactNode;
  description?: string;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
}

export function ReadonlyTextField({
  label,
  description: _description,
  placeholder,
  className,
  containerClassName,
  value,
}: ReadonlyTextFieldProps) {
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
        <Input
          value={value ?? ""}
          placeholder={placeholder}
          readOnly
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
