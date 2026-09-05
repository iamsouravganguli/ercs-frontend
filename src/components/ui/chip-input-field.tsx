"use client";
import { Control, FieldValues, Path } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { ChipInput } from "./chip-input";
import type { ReactNode } from "react";

type ChipInputFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: ReactNode;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
};

export function ChipInputField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  disabled,
  readOnly,
}: ChipInputFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel className="text-sm font-medium">
              {label}
              {required && <span className="ml-0.5 text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <ChipInput
              value={field.value as string}
              onValueChange={(val) => field.onChange(val)}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
