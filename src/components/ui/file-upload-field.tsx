"use client";

import { Control, FieldValues, Path } from "react-hook-form";
import type { ReactNode } from "react";
import { useState, useRef } from "react";
import { Paperclip, X, FileText } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

import { cn } from "@/lib/cn";

type FileUploadFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: ReactNode;
  required?: boolean;
  accept?: string;
  placeholder?: string;
  existingFileName?: string;
  containerClassName?: string;
  readonly?: boolean;
  onFileSelect?: (file: File | null) => void;
};

export function FileUploadField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  required,
  accept,
  placeholder = "Click to select or drop file",
  existingFileName,
  containerClassName,
  readonly,
  onFileSelect,
}: FileUploadFieldProps<T>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = selectedFile
    ? selectedFile.name
    : existingFileName
      ? `${existingFileName} (Click to change)`
      : placeholder;

  const hasFile = !!(selectedFile || existingFileName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedFile(null);
    onFileSelect?.(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readonly) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (readonly) return;
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file) {
      setSelectedFile(file);
      onFileSelect?.(file);
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
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
                "relative flex w-full h-9 items-center rounded-lg border overflow-hidden border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 focus-within:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 transition-colors transition-colors",
                isDragging
                  ? "border-primary ring-3 ring-ring/50 border-solid"
                  : "border-dashed border-input",
                readonly && "bg-muted dark:bg-zinc-900/50 cursor-default",
                !readonly && "cursor-pointer hover:border-ring/60",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !readonly && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                disabled={readonly}
                className="sr-only"
              />

              {}
              <span className="flex shrink-0 items-center self-stretch px-3 text-muted-foreground">
                {hasFile ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </span>

              {}
              <span
                className={cn(
                  "flex-1 text-sm truncate select-none",
                  hasFile
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                  readonly && "text-muted-foreground cursor-default",
                )}
              >
                {displayName}
              </span>

              {}
              {hasFile && !readonly && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex shrink-0 items-center self-stretch px-3 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
