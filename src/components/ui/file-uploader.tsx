"use client";

import * as React from "react";
import {
  UploadCloud,
  File as FileIcon,
  X,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { Badge } from "./badge";


const DEFAULT_ALLOWED = [".pdf", ".jpg", ".jpeg", ".png"] as const;
const DEFAULT_MAX_MB = 10;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExt(name: string) {
  return "." + (name.split(".").pop() || "").toLowerCase();
}

function validateFile(
  file: File,
  allowed: string[],
  maxMb: number,
): string | null {
  const ext = getExt(file.name);
  if (allowed.length && !allowed.includes(ext))
    return `Allowed: ${allowed.join(", ")}`;
  if (file.size > maxMb * 1024 * 1024) return `Max ${maxMb}MB`;
  return null;
}


export interface SingleFileUploaderProps {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  allowedExtensions?: string[];
  maxSizeMB?: number;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  className?: string;
}

export function SingleFileUploader({
  value,
  onChange,
  accept = ".pdf,.jpg,.jpeg,.png",
  allowedExtensions = [...DEFAULT_ALLOWED],
  maxSizeMB = DEFAULT_MAX_MB,
  disabled,
  placeholder = "Tap to select or drag & drop",
  helperText = "PDF, JPG, PNG — mobile camera supported",
  className,
}: SingleFileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handlePick = (f: File | null) => {
    if (!f) return;
    const err = validateFile(f, allowedExtensions, maxSizeMB);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onChange(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0] || null;
    if (f) handlePick(f);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {!value ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 sm:p-8 cursor-pointer transition-all active:scale-[0.99]",
            dragOver
              ? "border-primary bg-primary/5 dark:bg-primary/10"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center shrink-0">
            <UploadCloud className="w-6 h-6 text-zinc-500" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {placeholder}
            </p>
            <p className="text-xs text-muted-foreground px-2">{helperText}</p>
          </div>
          <Badge variant="outline" className="text-xs mt-1">
            Choose File
          </Badge>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              if (f) handlePick(f);
              if (e.target) e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
            {value.type?.startsWith("image/") ? (
              <ImageIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            ) : (
              <FileIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(value.size)} •{" "}
              {getExt(value.name).toUpperCase().replace(".", "")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onChange(null)}
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive px-1">{error}</p>}
    </div>
  );
}


export interface MultipleFileUploaderProps {
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  allowedExtensions?: string[];
  maxSizeMB?: number;
  maxFiles?: number;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  className?: string;
}

export function MultipleFileUploader({
  value,
  onChange,
  accept = ".pdf,.jpg,.jpeg,.png",
  allowedExtensions = [...DEFAULT_ALLOWED],
  maxSizeMB = DEFAULT_MAX_MB,
  maxFiles = 10,
  disabled,
  placeholder = "Tap to select or drag & drop (multiple)",
  helperText = "PDF, JPG, PNG — select multiple, mobile camera supported",
  className,
}: MultipleFileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAdd = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (value.length + incoming.length > maxFiles) {
      setError(`Max ${maxFiles} files`);
      return;
    }
    const valid: File[] = [];
    for (const f of incoming) {
      const err = validateFile(f, allowedExtensions, maxSizeMB);
      if (err) {
        setError(`${f.name}: ${err}`);
        return;
      }
      valid.push(f);
    }
    setError(null);
    onChange([...value, ...valid]);
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          if (e.dataTransfer.files?.length) handleAdd(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 sm:p-8 cursor-pointer transition-all active:scale-[0.99]",
          dragOver
            ? "border-primary bg-primary/5 dark:bg-primary/10"
            : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center shrink-0">
          <UploadCloud className="w-6 h-6 text-zinc-500" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">{placeholder}</p>
          <p className="text-xs text-muted-foreground px-2">
            {helperText} • {value.length}/{maxFiles}
          </p>
        </div>
        <Badge variant="outline" className="text-xs mt-1">
          Choose Files
        </Badge>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const list = e.target.files;
            if (list?.length) handleAdd(list);
            if (e.target) e.target.value = "";
          }}
        />
      </div>

      {value.length > 0 && (
        <div className="space-y-2 max-h-[40vh] overflow-auto pr-1 -mr-1">
          {value.map((f, idx) => (
            <div
              key={`${f.name}-${idx}`}
              className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                {f.type?.startsWith("image/") ? (
                  <ImageIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                ) : (
                  <FileText className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(f.size)} •{" "}
                  {getExt(f.name).toUpperCase().replace(".", "")}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="text-xs font-mono hidden sm:inline-flex"
              >
                {idx + 1}/{value.length}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeAt(idx)}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            {value.length} file{value.length > 1 ? "s" : ""} •{" "}
            {(value.reduce((a, f) => a + f.size, 0) / (1024 * 1024)).toFixed(2)}{" "}
            MB total
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => onChange([])}
            disabled={disabled}
          >
            Clear all
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive px-1">{error}</p>}
    </div>
  );
}


export interface FileUploaderToggleProps {
  mode: "single" | "multiple";
  singleValue: File | null;
  multipleValue: File[];
  onSingleChange: (f: File | null) => void;
  onMultipleChange: (fs: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  disabled?: boolean;
}

export function FileUploaderWithToggle({
  mode,
  singleValue,
  multipleValue,
  onSingleChange,
  onMultipleChange,
  accept,
  maxSizeMB,
  maxFiles,
  disabled,
}: FileUploaderToggleProps) {
  if (mode === "single") {
    return (
      <SingleFileUploader
        value={singleValue}
        onChange={onSingleChange}
        accept={accept}
        maxSizeMB={maxSizeMB}
        disabled={disabled}
      />
    );
  }
  return (
    <MultipleFileUploader
      value={multipleValue}
      onChange={onMultipleChange}
      accept={accept}
      maxSizeMB={maxSizeMB}
      maxFiles={maxFiles}
      disabled={disabled}
    />
  );
}
