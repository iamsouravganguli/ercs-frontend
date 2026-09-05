import * as React from "react";
import { cn } from "@/lib/cn";

type StatusVariant = "success" | "error" | "warning" | "info" | "neutral";

const variantStyles: Record<StatusVariant, string> = {
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
  error:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
  info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
  neutral:
    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
};

const dotBg: Record<StatusVariant, string> = {
  success: "bg-emerald-500 dark:bg-emerald-400",
  error: "bg-red-500 dark:bg-red-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  info: "bg-blue-500 dark:bg-blue-400",
  neutral: "bg-zinc-400 dark:bg-zinc-500",
};

interface StatusBadgeProps {
  variant?: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

function StatusBadge({
  variant = "neutral",
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none whitespace-nowrap",
        variantStyles[variant],
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotBg[variant])}
        aria-hidden="true"
      />
      <span className="leading-none">{children}</span>
    </span>
  );
}

export { StatusBadge };
export type { StatusVariant };
