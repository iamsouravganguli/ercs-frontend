"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { MouseEvent } from "react";
import Link from "next/link";

import { FormControl, FormField, FormItem, FormMessage } from "./form";

import { Checkbox } from "./checkbox";
import { cn } from "@/lib/cn";

type CheckboxFieldAuthProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  linkText?: string;
  linkHref?: string;
  linkText2?: string;
  linkHref2?: string;
  containerClassName?: string;
};

export function CheckboxFieldAuth<T extends FieldValues>({
  control,
  name,
  label,
  linkText,
  linkHref,
  linkText2,
  linkHref2,
  containerClassName,
}: CheckboxFieldAuthProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const id = String(name);

        return (
          <FormItem className={cn("space-y-1", containerClassName)}>
            <div className="flex items-start gap-3">
              {}
              <FormControl>
                <div className="flex items-center h-5">
                  <Checkbox
                    id={id}
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    className="h-5 w-5"
                  />
                </div>
              </FormControl>

              {}
              <label
                htmlFor={id}
                className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
              >
                {label}

                {linkText && linkHref && (
                  <>
                    {" "}
                    <Link
                      href={linkHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline font-medium"
                      onClick={(e: MouseEvent<HTMLAnchorElement>) =>
                        e.stopPropagation()
                      }
                    >
                      {linkText}
                    </Link>
                  </>
                )}

                {linkText2 && linkHref2 && (
                  <>
                    {" & "}
                    <Link
                      href={linkHref2}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline font-medium"
                      onClick={(e: MouseEvent<HTMLAnchorElement>) =>
                        e.stopPropagation()
                      }
                    >
                      {linkText2}
                    </Link>
                  </>
                )}
              </label>
            </div>

            <FormMessage className="text-xs" />
          </FormItem>
        );
      }}
    />
  );
}
