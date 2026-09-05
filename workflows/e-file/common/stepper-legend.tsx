"use client";
import { useTranslation } from "@/i18n";
import { Clock, Check, AlertCircle, Circle, Info } from "lucide-react";

export function StepperLegend() {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 px-3.5 py-3">
      <div className="flex gap-2">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-zinc-400 dark:text-zinc-500" />
        <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {t("case.efile.legend_note")}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2F4FA2] dark:bg-[#8AA6E0] text-white dark:text-[#1e2a4a]">
            <Clock className="h-3 w-3" />
          </span>
          {t("case.efile.legend.current")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-3 w-3" />
          </span>
          {t("case.efile.legend.completed")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
            <AlertCircle className="h-3 w-3" />
          </span>
          {t("case.efile.legend.pending")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600">
            <Circle className="h-3 w-3 text-zinc-400" />
          </span>
          {t("case.efile.legend.upcoming")}
        </span>
      </div>
    </div>
  );
}
