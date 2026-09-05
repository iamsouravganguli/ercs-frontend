"use client";

import { Control, FieldValues, Path, useController } from "react-hook-form";
import { useTranslation } from "@/i18n";

type OrderFormatFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
};

export function OrderFormatField<T extends FieldValues>({
  control,
  name,
  label,
  required,
}: OrderFormatFieldProps<T>) {
  const { lang } = useTranslation() as any;
  const { field, fieldState } = useController({ control, name });
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label ?? (lang === "hi" ? "आदेश प्रारूप" : "Order Format")}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-6 pt-1">
        <label
          htmlFor="format-digital"
          className="flex items-center gap-2 cursor-pointer group"
        >
          <span className="relative flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 group-has-[input:checked]:border-primary group-has-[input:checked]:bg-primary">
            <input
              id="format-digital"
              type="radio"
              name={field.name}
              value="DIGITAL"
              checked={field.value === "DIGITAL"}
              onChange={() => field.onChange("DIGITAL")}
              className="sr-only"
            />
            <span
              className={`h-2 w-2 rounded-full bg-white scale-0 group-has-[input:checked]:scale-100 transition-transform ${field.value === "DIGITAL" ? "scale-100" : "scale-0"}`}
            />
          </span>
          <span className="text-sm font-medium cursor-pointer">
            {lang === "hi"
              ? "डिजिटल (ऑनलाइन टाइप करें)"
              : "Digital Order (Type online)"}
          </span>
        </label>
        <label
          htmlFor="format-manual"
          className="flex items-center gap-2 cursor-pointer group"
        >
          <span className="relative flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 group-has-[input:checked]:border-primary group-has-[input:checked]:bg-primary">
            <input
              id="format-manual"
              type="radio"
              name={field.name}
              value="MANUAL"
              checked={field.value === "MANUAL"}
              onChange={() => field.onChange("MANUAL")}
              className="sr-only"
            />
            <span
              className={`h-2 w-2 rounded-full bg-white scale-0 group-has-[input:checked]:scale-100 transition-transform ${field.value === "MANUAL" ? "scale-100" : "scale-0"}`}
            />
          </span>
          <span className="text-sm font-medium cursor-pointer">
            {lang === "hi"
              ? "मैन्युअल (हस्ताक्षरित प्रति अपलोड करें)"
              : "Manual Order (Upload Scanned File)"}
          </span>
        </label>
      </div>
      {fieldState.error?.message && (
        <p className="text-xs font-medium text-red-500">
          {fieldState.error.message}
        </p>
      )}
    </div>
  );
}
