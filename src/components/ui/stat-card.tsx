"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./card";
import { cn } from "@/lib/cn";
import { LucideIcon } from "lucide-react";

import Link from "next/link";

export type StatCardItem = {
  label: string;
  value: string | number | null | undefined;
  naText?: string;
  change?: string | number;
  trend?: "up" | "down" | "neutral";
  sub?: string;
  icon: LucideIcon;
  allowedRoles?: string[];
  href?: string;
  onClick?: () => void;
};

type StatCardGridProps = {
  items: StatCardItem[];
  columns?: 2 | 3 | 4 | 5;
  role?: string;
  defaultNaText?: string;
};

const colsMap = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
};

export function StatCardGrid({
  items,
  columns = 4,
  role,
  defaultNaText = "N/A",
}: StatCardGridProps) {
  const visible = items.filter(
    ({ allowedRoles }) =>
      !allowedRoles ||
      allowedRoles.length === 0 ||
      (role && allowedRoles.includes(role)),
  );

  return (
    <div className={cn("grid gap-4", colsMap[columns])}>
      {visible.map((item) => (
        <StatCard key={item.label} defaultNaText={defaultNaText} {...item} />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  naText,
  change,
  trend = "neutral",
  sub,
  icon: Icon,
  href,
  onClick,
  defaultNaText = "N/A",
}: StatCardItem & { defaultNaText?: string }) {
  const parsed = Number(value);
  const isEmpty =
    value == null || value === "" || isNaN(parsed) || parsed === 0;
  const displayValue = isEmpty ? (naText ?? defaultNaText) : value;

  const cardContent = (
    <Card
      className={cn(
        "rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100/80 dark:border-blue-900/30 shadow-none transition-all duration-200",
        (href || onClick) &&
          "hover:bg-blue-100/60 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs cursor-pointer group/stat",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover/stat:text-slate-900 dark:group-hover/stat:text-white transition-colors">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover/stat:text-blue-600 dark:group-hover/stat:text-blue-400 transition-colors" />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-semibold text-slate-900 dark:text-white",
            isEmpty && "text-slate-400 dark:text-slate-500",
          )}
        >
          {displayValue}
        </div>
        {((change !== undefined && change !== null) || sub) && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            {change !== undefined && change !== null && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 font-medium",
                  trend === "up" &&
                    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
                  trend === "down" &&
                    "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
                  trend === "neutral" && "bg-muted text-muted-foreground",
                )}
              >
                {trend === "up" ? "▲" : trend === "down" ? "▼" : ""}
                {change}
              </span>
            )}
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick} className="block cursor-pointer">
        {cardContent}
      </div>
    );
  }

  return cardContent;
}
