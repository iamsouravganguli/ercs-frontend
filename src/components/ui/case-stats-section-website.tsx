"use client";

import * as React from "react";

export type StatItem = {
  label: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  valueColor?: string;
};

export type CaseStatsSectionWebsiteProps = {
  sectionTitle?: string;
  sectionSubtitle?: string;
  stats?: StatItem[];
};

const formatIN = (num: number | string | null | undefined) => {
  const parsed = Number(num);
  if (isNaN(parsed)) return num ?? "N/A";
  if (parsed === 0) return "0";
  return new Intl.NumberFormat("en-IN").format(parsed);
};

export function CaseStatsSectionWebsite({
  sectionTitle = "Statistics",
  sectionSubtitle = "Overview of case filings, disposals, and pending matters",
  stats = [],
}: CaseStatsSectionWebsiteProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <section className="w-full py-12 md:py-16 bg-slate-50/80 dark:bg-zinc-900/50 border-b border-border/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="max-w-3xl mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight tracking-tight">
            {sectionTitle}
          </h2>
          {sectionSubtitle && (
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xl">
              {sectionSubtitle}
            </p>
          )}
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground capitalize">
                  {stat.label}
                </span>
                {stat.icon && (
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      stat.iconBg || "bg-muted/50 text-foreground"
                    }`}
                  >
                    {stat.icon}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums leading-none">
                  {formatIN(stat.value)}
                </span>
                {stat.description && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
