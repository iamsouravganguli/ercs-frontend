"use client";

import { Control, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

import { Checkbox } from "./checkbox";
import { cn } from "@/lib/cn";

type CheckboxFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  required?: boolean;
  readonly?: boolean;
  containerClassName?: string;
};

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  description: _description,
  required,
  readonly,
  containerClassName,
}: CheckboxFieldProps<T>) {
  void _description;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const id = String(name);

        return (
          <FormItem className={cn("space-y-1", containerClassName)}>
            <div
              className={cn(
                "flex items-start gap-3",
                readonly && "opacity-60 pointer-events-none",
              )}
            >
              <FormControl>
                <div className="flex items-center h-5">
                  <Checkbox
                    id={id}
                    checked={!!field.value}
                    onCheckedChange={readonly ? undefined : field.onChange}
                    disabled={readonly}
                    className={cn("h-5 w-5", readonly && "cursor-default")}
                  />
                </div>
              </FormControl>

              <div className="flex items-center gap-1.5">
                {label && (
                  <FormLabel
                    htmlFor={id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {label}
                    {required && (
                      <span className="ml-0.5 text-destructive">*</span>
                    )}
                  </FormLabel>
                )}
              </div>
            </div>

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
