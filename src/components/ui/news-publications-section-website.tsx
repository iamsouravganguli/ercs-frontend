"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "@/i18n";

import {
  Newspaper,
  ExternalLink,
  FileText,
  Calendar,
  Megaphone,
  BookOpen,
  Search,
  Pin,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "./card";

import { Button } from "./button";
import { Input } from "./input";

type NewsType = "all" | "news" | "update" | "publication";

type NewsItem = {
  type: Exclude<NewsType, "all">;
  docNumber: string;
  name_en: string;
  name_hi: string;
  description: string;
  date: string;
  docUrl: string;
  pinned?: boolean;
};

const TYPE_CONFIG = {
  news: {
    icon: Newspaper,
    label: "News",
    color: "text-sky-600",
    bg: "bg-sky-500/10",
    border: "border-sky-400/30",
  },
  update: {
    icon: Megaphone,
    label: "Update",
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-400/30",
  },
  publication: {
    icon: BookOpen,
    label: "Publication",
    color: "text-violet-600",
    bg: "bg-violet-500/10",
    border: "border-violet-400/30",
  },
} as const;

export function NewsPublicationsSectionWebsite() {
  const { t, lang } = useTranslation();

  const [filter, setFilter] = useState<NewsType>("all");
  const [search, setSearch] = useState("");

  const items: NewsItem[] = [
    {
      type: "news",
      pinned: true,
      docNumber: "RC/2026/001",
      name_en: "Revenue Court Notice regarding case hearings",
      name_hi: "राजस्व न्यायालय सुनवाई संबंधी सूचना",
      description:
        "Official notice related to upcoming revenue court hearings.",
      date: "12 Mar 2026",
      docUrl: "/documents/revenue-court-notice.pdf",
    },
    {
      type: "update",
      docNumber: "RC/2026/002",
      name_en: "Online Case Status Feature Updated",
      name_hi: "ऑनलाइन केस स्थिति सुविधा अपडेट",
      description: "New improvements added to the revenue case search system.",
      date: "08 Mar 2026",
      docUrl: "/documents/case-status-guidelines.docx",
    },
    {
      type: "publication",
      docNumber: "RC/2026/003",
      name_en: "Revenue Court Administrative Circular",
      name_hi: "राजस्व न्यायालय प्रशासनिक परिपत्र",
      description:
        "Circular regarding administrative procedures of revenue courts.",
      date: "01 Mar 2026",
      docUrl: "/documents/revenue-court-circular.pdf",
    },
  ];

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => filter === "all" || item.type === filter)
      .filter((item) => {
        const title = lang === "hi" ? item.name_hi : item.name_en;
        return title.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [filter, search, lang]);

  const getFileIcon = (url: string) => {
    if (url.endsWith(".pdf"))
      return <FileText className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
    if (url.endsWith(".doc") || url.endsWith(".docx"))
      return <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
    if (url.endsWith(".xls") || url.endsWith(".xlsx"))
      return <FileText className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
    return <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />;
  };

  const filterButtons: { value: NewsType; label: string }[] = [
    { value: "all", label: t("news.filter.all") || "All" },
    { value: "news", label: t("news.filter.news") || "News" },
    { value: "update", label: t("news.filter.update") || "Updates" },
    {
      value: "publication",
      label: t("news.filter.publication") || "Publications",
    },
  ];

  return (
    <section className="w-full py-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Newspaper className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
              {t("news.title")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("news.subtitle") || "Latest notices, updates and publications"}
            </p>
          </div>
        </div>

        <Card className="border-border shadow-sm overflow-hidden">
          {}
          <CardHeader className="pb-0 border-b border-border bg-muted/30">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-4">
              {}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("news.search") || "Search notices..."}
                  className="pl-9 h-10 bg-background border-border"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {}
              <div className="flex flex-wrap gap-1.5">
                {filterButtons.map(({ value, label }) => {
                  const active = filter === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`
                        px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide
                        transition-all duration-150 border
                        ${
                          active
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                        }
                      `}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          {}
          <CardContent className="p-0">
            <div
              className={`divide-y divide-border ${filteredItems.length > 5 ? "max-h-[580px] overflow-y-auto" : ""}`}
            >
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <Search className="w-8 h-8 opacity-30" />
                  <p className="text-sm">
                    {t("news.no_results") || "No results found"}
                  </p>
                </div>
              ) : (
                filteredItems.map((item, i) => {
                  const title = lang === "hi" ? item.name_hi : item.name_en;
                  const cfg = TYPE_CONFIG[item.type];
                  const TypeIcon = cfg.icon;

                  return (
                    <a
                      key={i}
                      href={item.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-4 px-5 py-4
                        hover:bg-muted/40 transition-colors duration-150"
                    >
                      {}
                      {getFileIcon(item.docUrl)}

                      {}
                      <div className="flex-1 min-w-0">
                        {}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {}
                          <span
                            className={`
                            inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                            text-[10px] font-semibold tracking-wide border
                            ${cfg.color} ${cfg.bg} ${cfg.border}
                          `}
                          >
                            <TypeIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>

                          {}
                          <span className="text-[10px] text-muted-foreground font-mono">
                            #{item.docNumber}
                          </span>

                          {}
                          {item.pinned && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                              text-[10px] font-semibold bg-red-500/10 border border-red-400/30 text-red-600"
                            >
                              <Pin className="w-2.5 h-2.5" />
                              {t("news.pinned") || "Pinned"}
                            </span>
                          )}
                        </div>

                        {}
                        <p
                          className="text-sm font-semibold text-foreground leading-snug
                          group-hover:text-primary transition-colors"
                        >
                          {title}
                        </p>

                        {}
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-1">
                          {item.description}
                        </p>
                      </div>

                      {}
                      <div className="flex flex-col items-end gap-1.5 shrink-0 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.date}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                      </div>
                    </a>
                  );
                })
              )}
            </div>
          </CardContent>

          {}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {filteredItems.length} {t("news.results") || "results"}
            </p>

            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
            >
              {t("news.view_more") || "View all"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
