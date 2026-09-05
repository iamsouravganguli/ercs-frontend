"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import * as React from "react";
import Holidays from "date-holidays";
import Link from "next/link";
import { useTranslation } from "@/i18n";

import {
  Newspaper,
  ExternalLink,
  FileText,
  Calendar as CalendarIcon,
  Megaphone,
  BookOpen,
  Search,
  Pin,
  ArrowRight,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/cn";


type NewsType = "all" | "news" | "update" | "publication";

type NewsItem = {
  type: Exclude<NewsType, "all">;
  docNumber: string;
  title: string;
  description: string;
  date: string;
  docUrl: string;
  externalUrl?: string;
  pinned?: boolean;
};

export type Holiday = {
  date: string;
  name: string;
  nameHi?: string;
};

type TypeConfig = {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
};

type FilterButton = {
  value: NewsType;
  label: string;
};

type NewsHolidaySectionWebsiteProps = {
  newsSectionTitle?: string;
  newsSectionSubtitle?: string;
  newsItems?: NewsItem[];
  searchPlaceholder?: string;
  noResultsText?: string;
  noNewsText?: string;
  resultsText?: string;
  viewAllText?: string;
  pinnedText?: string;
  filterButtons?: FilterButton[];
  typeConfig?: Record<Exclude<NewsType, "all">, TypeConfig>;
  onViewAll?: () => void;

  currentPage?: number;
  totalPages?: number;
  totalResults?: number;
  onPageChange?: (page: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  categoryValue?: string;
  onCategoryChange?: (value: string) => void;

  holidaySectionTitle?: string;
  holidaySectionSubtitle?: string;
  holidays?: Holiday[];
  holidayCountry?: string;
  holidayState?: string;
  holidayYear?: number;
  upcomingHolidaysText?: string;
  todayText?: string;
  tomorrowText?: string;
  inDaysText?: string;
  daysText?: string;
  prevMonthLabel?: string;
  nextMonthLabel?: string;

  locale?: string;
  lang?: "en" | "hi";
};

const defaultTypeConfig: Record<Exclude<NewsType, "all">, TypeConfig> = {
  news: {
    icon: Newspaper,
    label: "News",
    color: "text-primary dark:text-primary-foreground",
    bg: "bg-primary/5 dark:bg-primary/15",
    border: "border-primary/10 dark:border-primary/20",
  },
  update: {
    icon: Megaphone,
    label: "Update",
    color: "text-primary dark:text-primary-foreground",
    bg: "bg-primary/5 dark:bg-primary/15",
    border: "border-primary/10 dark:border-primary/20",
  },
  publication: {
    icon: BookOpen,
    label: "Publication",
    color: "text-primary dark:text-primary-foreground",
    bg: "bg-primary/5 dark:bg-primary/15",
    border: "border-primary/10 dark:border-primary/20",
  },
};

const defaultFilterButtons: FilterButton[] = [
  { value: "all", label: "All" },
  { value: "news", label: "News" },
  { value: "update", label: "Updates" },
  { value: "publication", label: "Publications" },
];


function toMidnight(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}
function formatMonthYear(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
}


function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight tracking-tight">
        {title}
      </h2>
      <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
    </div>
  );
}


function FileIcon({ url }: { url: string }) {
  return (
    <FileText className="w-3.5 h-3.5 text-primary/80 dark:text-primary-foreground/80 shrink-0" />
  );
}


export function NewsHolidaySectionWebsite({
  newsSectionTitle = "News & Notices",
  newsSectionSubtitle = "Latest notices, updates and publications",
  newsItems = [],
  searchPlaceholder = "Search notices...",
  noResultsText = "No results found",
  noNewsText = "No news available",
  resultsText = "results",
  viewAllText = "View all",
  pinnedText = "Pinned",
  filterButtons,
  typeConfig = defaultTypeConfig,
  onViewAll,

  currentPage = 1,
  totalPages = 1,
  totalResults,
  onPageChange,
  searchValue,
  onSearchChange,
  categoryValue = "all",
  onCategoryChange,

  holidaySectionTitle = "Holiday Calendar",
  holidaySectionSubtitle = "Public & gazetted holidays",
  holidays: holidaysProp,
  holidayCountry = "IN",
  holidayState = "UT",
  holidayYear,
  upcomingHolidaysText = "Upcoming Holidays",
  todayText = "Today",
  tomorrowText = "Tomorrow",
  inDaysText = "in",
  daysText = "days",
  prevMonthLabel = "Previous month",
  nextMonthLabel = "Next month",

  locale = "en-IN",
  lang = "en",
}: NewsHolidaySectionWebsiteProps) {
  const { t } = useTranslation();

  const translatedFilterButtons: FilterButton[] = useMemo(() => {
    const isHi = lang === "hi";
    return [
      { value: "all", label: isHi ? "सभी" : "All" },
      { value: "news", label: isHi ? "समाचार" : "News" },
      { value: "update", label: isHi ? "अपडेट" : "Updates" },
      { value: "publication", label: isHi ? "प्रकाशन" : "Publications" },
    ];
  }, [lang]);

  const activeFilterButtons = filterButtons || translatedFilterButtons;


  const [filter, setFilter] = useState<NewsType>(
    (categoryValue || "all") as NewsType,
  );
  const [search, setSearch] = useState(searchValue || "");
  const hasNews = newsItems.length > 0 || !!search || !!searchValue;

  useEffect(() => {
    if (searchValue !== undefined) {
      setSearch(searchValue);
    }
  }, [searchValue]);

  useEffect(() => {
    if (categoryValue !== undefined) {
      setFilter(categoryValue as NewsType);
    }
  }, [categoryValue]);

  const filteredItems = useMemo(() => {
    if (!hasNews) return [];
    return [...newsItems]
      .filter((i) => filter === "all" || i.type === filter)
      .filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false));
  }, [filter, search, newsItems, hasNews]);


  const activeYear = useMemo(() => {
    if (holidayYear) return holidayYear;
    if (holidaysProp && holidaysProp.length > 0)
      return parseInt(holidaysProp[0]!.date.split("-")[0]!, 10);
    return new Date().getFullYear();
  }, [holidayYear, holidaysProp]);


  const [autoHolidays, setAutoHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    if (holidaysProp && holidaysProp.length > 0) return;
    try {
      const hd = new Holidays(holidayCountry, holidayState);
      const rawEn = hd.getHolidays(activeYear, "en");
      const rawHi = hd.getHolidays(activeYear, "hi");
      const hiMap = new Map<string, string>();
      rawHi
        .filter((h) => h.type === "public")
        .forEach((h) => {
          const date = h.date.split(" ")[0];
          if (date) hiMap.set(date, h.name);
        });
      const mapped: Holiday[] = rawEn
        .filter((h) => h.type === "public")
        .map((h) => {
          const date = h.date.split(" ")[0] ?? "";
          return { date, name: h.name, nameHi: hiMap.get(date) ?? h.name };
        })
        .filter((h) => h.date !== "")
        .sort((a, b) => a.date.localeCompare(b.date));
      setAutoHolidays(mapped);
    } catch (e) {
      console.error("date-holidays error:", e);
    }
  }, [holidaysProp, holidayCountry, holidayState, activeYear]);

  const allHolidays = useMemo(
    () =>
      holidaysProp && holidaysProp.length > 0 ? holidaysProp : autoHolidays,
    [holidaysProp, autoHolidays],
  );


  const todayMidnight = useMemo(() => toMidnight(new Date()), []);

  const initMonth = useMemo(() => {
    const now = new Date();
    if (now.getFullYear() === activeYear) return monthStart(now);
    return new Date(activeYear, 0, 1);
  }, [activeYear]);

  const [displayMonth, setDisplayMonth] = useState<Date>(initMonth);
  useEffect(() => {
    setDisplayMonth(initMonth);
  }, [initMonth]);

  const isFirstMonth = displayMonth.getMonth() === 0;
  const isLastMonth = displayMonth.getMonth() === 11;

  const prevMonth = useCallback(() => {
    if (isFirstMonth) return;
    setDisplayMonth((d) =>
      monthStart(new Date(d.getFullYear(), d.getMonth() - 1, 1)),
    );
  }, [isFirstMonth]);

  const nextMonth = useCallback(() => {
    if (isLastMonth) return;
    setDisplayMonth((d) =>
      monthStart(new Date(d.getFullYear(), d.getMonth() + 1, 1)),
    );
  }, [isLastMonth]);

  const anchor = useMemo(() => monthStart(displayMonth), [displayMonth]);


  const visibleHolidays = useMemo(() => {
    const sorted = [...allHolidays]
      .filter((h) => h.date.startsWith(`${activeYear}-`))
      .sort((a, b) => a.date.localeCompare(b.date));
    const fromAnchor = sorted.filter((h) => parseDate(h.date) >= anchor);
    if (fromAnchor.length >= 6) return fromAnchor.slice(0, 6);
    const before = sorted.filter((h) => parseDate(h.date) < anchor).reverse();
    const needed = 6 - fromAnchor.length;
    return [...before.slice(0, needed).reverse(), ...fromAnchor];
  }, [allHolidays, anchor, activeYear]);


  const nextHoliday = useMemo(() => {
    return (
      allHolidays
        .filter((h) => h.date.startsWith(`${activeYear}-`))
        .map((h) => ({ ...h, d: parseDate(h.date) }))
        .filter((h) => h.d >= anchor)
        .sort((a, b) => a.d.getTime() - b.d.getTime())[0] ?? null
    );
  }, [allHolidays, anchor, activeYear]);

  const daysUntil = useMemo(() => {
    if (!nextHoliday) return null;
    return Math.ceil(
      (nextHoliday.d.getTime() - todayMidnight.getTime()) / 86_400_000,
    );
  }, [nextHoliday, todayMidnight]);

  const daysLabel = useMemo(() => {
    if (daysUntil === null || daysUntil < 0) return "";
    if (daysUntil === 0) return todayText;
    if (daysUntil === 1) return tomorrowText;
    return `${inDaysText} ${daysUntil} ${daysText}`;
  }, [daysUntil, todayText, tomorrowText, inDaysText, daysText]);

  const formatDate = useCallback(
    (dateStr: string) =>
      parseDate(dateStr).toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  const holidayName = useCallback(
    (h: Holiday) => (lang === "hi" && h.nameHi ? h.nameHi : h.name),
    [lang],
  );


  return (
    <section className="w-full py-12 bg-muted/50 border-t border-border/40 text-foreground relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {}
          <div className="flex flex-col">
            <SectionHeader
              title={newsSectionTitle}
              subtitle={newsSectionSubtitle}
            />

            <div className="flex flex-col flex-1 rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              {}
              <div className="px-4 pt-4 pb-3 border-b border-border space-y-3 bg-muted/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder={searchPlaceholder}
                    disabled={!hasNews}
                    className="pl-9 pr-9 h-9 bg-background border-border text-sm rounded-lg
                      focus-visible:ring-1 focus-visible:ring-primary/30
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    value={search}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearch(val);
                      onSearchChange?.(val);
                    }}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        onSearchChange?.("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeFilterButtons.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => {
                        if (hasNews) {
                          setFilter(value);
                          onCategoryChange?.(value);
                        }
                      }}
                      disabled={!hasNews}
                      className={[
                        "h-7 px-3 rounded-full text-xs font-medium border transition-all duration-150",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        !hasNews
                          ? "bg-background text-muted-foreground border-border"
                          : filter === value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/45 hover:text-foreground",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {}
              <div
                className="flex-1 overflow-y-auto divide-y divide-border/60"
                style={{ maxHeight: 420 }}
              >
                {!hasNews ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                    <Newspaper className="w-6 h-6 opacity-25" />
                    <p className="text-sm">{noNewsText}</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                    <Search className="w-6 h-6 opacity-25" />
                    <p className="text-sm">{noResultsText}</p>
                  </div>
                ) : (
                  filteredItems.map((item, i) => {
                    const cfg = typeConfig[item.type];
                    const hasAttachment = !!(item.docUrl || item.externalUrl);
                    const targetUrl = item.externalUrl || item.docUrl || "";
                    const CardWrapper = "div";
                    const wrapperProps = {
                      className: cn(
                        "group flex items-center justify-between gap-4 px-5 py-4 transition-all duration-200 border-b border-border/40 hover:bg-muted/45",
                        targetUrl && "cursor-pointer",
                        "border-l-2 border-l-transparent",
                        item.pinned &&
                          "border-l-amber-500 bg-amber-500/[0.015] dark:bg-amber-500/[0.03]",
                      ),
                      onClick: targetUrl
                        ? () => {
                            window.open(
                              targetUrl,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }
                        : undefined,
                    };

                    return (
                      <CardWrapper key={`news-${i}`} {...wrapperProps}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            {item.pinned && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold
                                bg-amber-500/10 dark:bg-amber-500/20
                                border border-amber-500/20 dark:border-amber-500/30
                                text-amber-600 dark:text-amber-400 shrink-0"
                                title="Pinned to top"
                              >
                                <Pin className="w-2.5 h-2.5 fill-current" />
                              </span>
                            )}
                            <span
                              className={[
                                "inline-flex items-center px-1.5 py-0.5 rounded-md",
                                "text-[10px] font-semibold border shrink-0",
                                cfg.color,
                                cfg.bg,
                                cfg.border,
                              ].join(" ")}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "text-sm font-medium text-foreground leading-snug line-clamp-1 transition-colors",
                              hasAttachment &&
                                "group-hover:text-primary dark:group-hover:text-secondary-foreground",
                            )}
                          >
                            {item.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground/75">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {item.date}
                            </span>
                            {item.description && (
                              <span className="line-clamp-1">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.docUrl && (
                            <a
                              href={item.docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full border border-border/40 bg-background text-muted-foreground/70 transition-all duration-200 shadow-2xs",
                                "hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-xs",
                              )}
                              onClick={(e) => e.stopPropagation()}
                              title="Download/View Document"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {item.externalUrl && (
                            <a
                              href={item.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full border border-border/40 bg-background text-muted-foreground/70 transition-all duration-200 shadow-2xs",
                                "hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-xs",
                              )}
                              onClick={(e) => e.stopPropagation()}
                              title="View External Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </CardWrapper>
                    );
                  })
                )}
              </div>

              {}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/5">
                <p className="text-xs text-muted-foreground">
                  {totalResults !== undefined
                    ? `${totalResults} ${resultsText}`
                    : hasNews
                      ? `${filteredItems.length} ${resultsText}`
                      : `0 ${resultsText}`}
                </p>

                {totalPages && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => onPageChange?.(currentPage - 1)}
                      disabled={currentPage <= 1}
                      title={prevMonthLabel}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-[11px] text-muted-foreground font-semibold px-1 select-none">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => onPageChange?.(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      title={nextMonthLabel}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {}
          <div className="flex flex-col">
            <SectionHeader
              title={holidaySectionTitle}
              subtitle={holidaySectionSubtitle}
            />

            <div className="flex flex-col flex-1 rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              {}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/10">
                <button
                  onClick={prevMonth}
                  disabled={isFirstMonth}
                  aria-label={prevMonthLabel}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md
                    text-muted-foreground hover:text-foreground hover:bg-accent
                    transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm font-semibold text-foreground capitalize">
                  {formatMonthYear(displayMonth, locale)}
                </span>

                <button
                  onClick={nextMonth}
                  disabled={isLastMonth}
                  aria-label={nextMonthLabel}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md
                    text-muted-foreground hover:text-foreground hover:bg-accent
                    transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {}
              {nextHoliday && daysLabel && (
                <div
                  className="mx-4 mt-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg
                  bg-primary/5 dark:bg-primary/15 border border-primary/10 dark:border-primary/20"
                >
                  <Clock className="w-3.5 h-3.5 text-primary dark:text-primary-foreground shrink-0" />
                  <p className="text-xs text-foreground leading-tight min-w-0">
                    <span className="font-semibold text-primary dark:text-primary-foreground">
                      {holidayName(nextHoliday)}
                    </span>
                    {" — "}
                    <span>{daysLabel}</span>
                    <span className="text-muted-foreground ml-1">
                      ({formatDate(nextHoliday.date)})
                    </span>
                  </p>
                </div>
              )}

              {}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border mt-3">
                <h3 className="text-xs font-semibold text-foreground">
                  {upcomingHolidaysText}
                </h3>
                <span
                  className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full
                  bg-primary/10 dark:bg-primary/30
                  text-primary dark:text-white
                  text-[10px] font-semibold"
                >
                  {visibleHolidays.length}
                </span>
              </div>

              {}
              <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {visibleHolidays.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                    <CalendarDays className="w-6 h-6 opacity-25" />
                    <p className="text-sm">No holidays found</p>
                  </div>
                ) : (
                  visibleHolidays.map((holiday, i) => {
                    const hDate = parseDate(holiday.date);
                    const isPast = hDate < todayMidnight;
                    const isToday = hDate.getTime() === todayMidnight.getTime();
                    const isNext = nextHoliday?.date === holiday.date;
                    const inThisMonth =
                      hDate.getMonth() === displayMonth.getMonth() &&
                      hDate.getFullYear() === displayMonth.getFullYear();

                    return (
                      <div
                        key={`holiday-${i}-${holiday.date}`}
                        className={[
                          "flex items-center gap-3 px-4 py-3 transition-colors",
                          isNext
                            ? "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15"
                            : inThisMonth
                              ? "bg-muted/10 hover:bg-muted/20"
                              : "hover:bg-muted/10",
                          isPast && !isToday ? "opacity-50" : "",
                        ].join(" ")}
                      >
                        {}
                        <div
                          className={[
                            "flex flex-col items-center justify-center rounded-lg shrink-0 w-10 h-10 border",
                            isToday
                              ? "bg-primary/10 dark:bg-primary/20 border-primary/20 text-primary dark:text-primary-foreground"
                              : isNext
                                ? "bg-primary/10 dark:bg-primary/30 border-primary/20 text-primary dark:text-white"
                                : inThisMonth
                                  ? "bg-primary/5 dark:bg-primary/10 border-primary/15 text-primary dark:text-primary-foreground"
                                  : "bg-muted dark:bg-muted/50 border-border text-muted-foreground",
                          ].join(" ")}
                        >
                          <span className="text-sm font-bold leading-none">
                            {hDate.getDate()}
                          </span>
                          <span className="text-[10px] font-medium leading-none mt-0.5 uppercase">
                            {hDate.toLocaleDateString(locale, {
                              month: "short",
                            })}
                          </span>
                        </div>

                        {}
                        <div className="flex-1 min-w-0">
                          <p
                            className={[
                              "text-sm font-medium leading-tight truncate",
                              isNext
                                ? "text-primary dark:text-white"
                                : "text-foreground",
                            ].join(" ")}
                          >
                            {holidayName(holiday)}
                          </p>
                          {lang === "hi" &&
                            holiday.nameHi &&
                            holiday.nameHi !== holiday.name && (
                              <p className="text-[11px] text-muted-foreground leading-tight truncate mt-0.5">
                                {holiday.name}
                              </p>
                            )}
                          {isNext && daysLabel && (
                            <p className="text-[10px] text-primary/70 dark:text-white/60 font-medium mt-0.5">
                              {daysLabel}
                            </p>
                          )}
                        </div>

                        {}
                        <span
                          className={[
                            "text-[11px] font-medium shrink-0 whitespace-nowrap",
                            isNext
                              ? "text-primary/70 dark:text-white/70"
                              : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {hDate.toLocaleDateString(locale, {
                            weekday: "short",
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
