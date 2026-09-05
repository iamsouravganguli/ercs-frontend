"use client";
import { Control, FieldValues, Path } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { CustomCombobox, CustomComboboxOption } from "./custom-combobox";
import type { ReactNode } from "react";

type CustomComboboxFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: ReactNode;
  required?: boolean;
  placeholder?: string;
  options?: CustomComboboxOption[];
  disabled?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  onSelect?: (val: string | number | null) => void;
  onSearch?: (query: string) => void;
  debounceMs?: number;
  renderOption?: (
    option: CustomComboboxOption,
    state: { isSelected: boolean; isHighlighted: boolean },
  ) => ReactNode;
};

export function CustomComboboxField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  placeholder,
  options = [],
  disabled,
  readOnly,
  loading,
  onSelect,
  onSearch,
  debounceMs,
  renderOption,
}: CustomComboboxFieldProps<T>) {
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
            <CustomCombobox
              options={options}
              value={field.value ?? null}
              onValueChange={(val) => {
                field.onChange(val);
                onSelect?.(val);
              }}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              loading={loading}
              onSearch={onSearch}
              debounceMs={debounceMs}
              renderOption={renderOption}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
