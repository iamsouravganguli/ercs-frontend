"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/i18n";
import { useSessionCheck } from '@/lib/query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  FileText,
  Calendar,
  Mail,
  Scale,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";


interface ParsedArticle {
  id: string;
  category: string;
  categoryName: string;
  question: string;
  answer: string;
}


function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  let html = markdown;


  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");


  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");


  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");


  html = html.replace(
    /^\s*[-*]\s+(.*?)$/gm,
    "<div class='flex items-start gap-2 my-1'><span class='text-primary shrink-0'>•</span><span class='text-xs text-muted-foreground'>$1</span></div>",
  );


  html = html.replace(
    /^\s*(\d+)\.\s+(.*?)$/gm,
    "<div class='flex items-start gap-2 my-1'><span class='font-semibold text-primary shrink-0'>$1.</span><span class='text-xs text-muted-foreground'>$2</span></div>",
  );


  const blocks = html.split(/\n\n+/);
  html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<div") || trimmed.startsWith("<h")) {
        return trimmed;
      }
      return `<p class='text-xs text-muted-foreground leading-relaxed my-1.5'>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}


function parseKbMarkdown(text: string): ParsedArticle[] {
  const articles: ParsedArticle[] = [];
  const lines = text.split("\n");

  let currentCategory = "general";
  let currentCategoryName = "General";
  let currentQuestion = "";
  let currentAnswerLines: string[] = [];
  let articleCount = 1;

  const commitArticle = () => {
    if (currentQuestion) {
      articles.push({
        id: `art-${articleCount++}`,
        category: currentCategory,
        categoryName: currentCategoryName,
        question: currentQuestion.trim(),
        answer: currentAnswerLines.join("\n").trim(),
      });
      currentAnswerLines = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();


    if (trimmed.startsWith("# ")) {
      commitArticle();
      currentQuestion = "";

      const content = trimmed.substring(2).trim();
      if (content.toLowerCase().startsWith("category:")) {
        const parts = content.substring(9).split("|");
        currentCategory = parts[0].trim().toLowerCase();
        currentCategoryName = parts[1] ? parts[1].trim() : parts[0].trim();
      } else {
        currentCategory = content.replace(/\s+/g, "-").toLowerCase();
        currentCategoryName = content;
      }
    }

    else if (trimmed.startsWith("## ")) {
      commitArticle();
      currentQuestion = trimmed.substring(3).trim();
    }

    else {
      if (currentQuestion) {
        currentAnswerLines.push(line);
      }
    }
  }

  commitArticle();
  return articles;
}


const isCourtRole = (role: string) => {
  const upper = (role || "").toUpperCase();
  return ["SA", "PO", "CO", "CC", "RI", "RSI"].includes(upper);
};

export default function KnowledgeBasePage() {
  const { t, lang } = useTranslation();
  const { data: sessionData } = useSessionCheck();

  const userRole = sessionData?.result?.data?.role || "";
  const currentLang = lang === "hi" ? "hi" : "en";


  const [selectedRoleType, setSelectedRoleType] = useState<
    "citizen_advocate" | "court_side"
  >("citizen_advocate");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(
    null,
  );
  const [articles, setArticles] = useState<ParsedArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);


  useEffect(() => {
    if (userRole) {
      if (isCourtRole(userRole)) {
        setSelectedRoleType("court_side");
      } else {
        setSelectedRoleType("citizen_advocate");
      }
    }
  }, [userRole]);


  useEffect(() => {
    const fetchKbContent = async () => {
      setLoading(true);
      try {
        const fileName = `${selectedRoleType}_${currentLang}.md`;
        const res = await fetch(`/kb/${fileName}`);
        if (!res.ok) {
          throw new Error(`Failed to load ${fileName}`);
        }
        const text = await res.text();
        const parsed = parseKbMarkdown(text);
        setArticles(parsed);
      } catch (err) {
        console.error("Failed to load knowledge base markdown content", err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchKbContent();
  }, [selectedRoleType, currentLang]);


  const handleToggleAccordion = (id: string) => {
    setExpandedArticleId((prev) => (prev === id ? null : id));
  };


  const categoriesList = useMemo(() => {
    const defaultCategories = [
      {
        id: "all",
        label: currentLang === "hi" ? "सभी विषय" : "All Topics",
        icon: HelpCircle,
      },
    ];

    const iconMap: Record<string, any> = {
      filing: FileText,
      tracking: Search,
      summons: Mail,
      hearings: Calendar,
      orders: Scale,
    };

    const uniqueCategories = Array.from(
      new Set(articles.map((a) => a.category)),
    );
    const categoriesMapped = uniqueCategories.map((catId) => {
      const match = articles.find((a) => a.category === catId);
      return {
        id: catId,
        label: match ? match.categoryName : catId,
        icon: iconMap[catId] || HelpCircle,
      };
    });

    return [...defaultCategories, ...categoriesMapped];
  }, [articles, currentLang]);


  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {

      if (activeCategory !== "all" && article.category !== activeCategory) {
        return false;
      }


      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const question = article.question.toLowerCase();
      const answer = article.answer.toLowerCase();
      return question.includes(q) || answer.includes(q);
    });
  }, [articles, activeCategory, searchQuery]);

  return (
    <div className="w-full bg-background min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <div className="flex items-center space-x-1.5 text-xs text-muted-foreground/80 mb-6 truncate select-none">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            RCCMS
          </span>
          <span>›</span>
          <span className="text-muted-foreground font-normal">
            {t("kb.title") || "Knowledge Base"}
          </span>
        </div>

        {}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-6 gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight tracking-tight">
              {t("kb.title") || "Knowledge Base"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              {t("kb.subtitle") ||
                "Find answers to frequently asked questions and guides."}
            </p>
          </div>

          {}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[10px] font-bold text-muted-foreground/85 uppercase tracking-wider hidden md:inline">
              {t("kb.role_view") || "Role View"}:
            </span>
            <div className="flex bg-muted p-0.5 rounded-lg border border-border text-[11px] font-medium shrink-0 shadow-3xs">
              <button
                onClick={() => {
                  setSelectedRoleType("citizen_advocate");
                  setActiveCategory("all");
                  setExpandedArticleId(null);
                }}
                className={`px-3 py-1 rounded-md transition-all duration-200 cursor-pointer ${
                  selectedRoleType === "citizen_advocate"
                    ? "bg-background text-foreground shadow-3xs border border-border/20 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("kb.citizen_advocate") || "Citizen & Advocate FAQs"}
              </button>
              <button
                onClick={() => {
                  setSelectedRoleType("court_side");
                  setActiveCategory("all");
                  setExpandedArticleId(null);
                }}
                className={`px-3 py-1 rounded-md transition-all duration-200 cursor-pointer ${
                  selectedRoleType === "court_side"
                    ? "bg-background text-foreground shadow-3xs border border-border/20 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("kb.court_side") || "Court Staff FAQs"}
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="relative max-w-xl mb-8">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground/60">
            <Search className="h-4 w-4" />
          </div>
          <Input
            type="text"
            placeholder={
              t("kb.search_placeholder") ||
              "Search articles, questions, keywords..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 py-5 bg-card shadow-3xs border-border/80 focus-visible:ring-primary/20 text-xs rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {}
          <div className="w-full md:w-60 shrink-0 space-y-2 md:sticky md:top-4">
            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest px-2 block select-none">
              Topics
            </span>
            <div className="flex flex-wrap md:flex-col gap-1.5 p-1.5 bg-card border border-border rounded-xl shadow-3xs w-full">
              {categoriesList.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setExpandedArticleId(null);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer w-full group ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-3xs border border-zinc-200 dark:border-zinc-750"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-muted/40 border border-transparent"
                    }`}
                  >
                    <CatIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {}
          <div className="flex-1 w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40 select-none">
              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                Showing {filteredArticles.length} Articles
              </span>
              {searchQuery && (
                <Badge
                  variant="outline"
                  className="text-[9px] font-medium bg-muted text-muted-foreground border-border/50"
                >
                  Search: &ldquo;{searchQuery}&rdquo;
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground animate-pulse">
                  Loading content...
                </span>
              </div>
            ) : filteredArticles.length === 0 ? (
              <Card className="border-dashed border-border bg-card/25 text-center p-12 flex flex-col items-center justify-center rounded-xl shadow-none">
                <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground/60">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-semibold text-foreground">
                  {t("kb.no_results") ||
                    "No articles found matching your search."}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                  Verify the spelling, try different keywords, or check the
                  other role view guide.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  variant="outline"
                  className="mt-4 text-[10px] h-7 cursor-pointer"
                >
                  Clear Search & Filters
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredArticles.map((article, i) => {
                  const isExpanded = expandedArticleId === article.id;

                  return (
                    <div
                      key={article.id}
                      className={`group bg-card border border-border rounded-xl overflow-hidden
                        hover:border-primary/45 hover:bg-muted/5 transition-all duration-200 cursor-pointer ${isExpanded ? "border-primary/45 bg-muted/5" : ""}`}
                    >
                      {}
                      <button
                        onClick={() => handleToggleAccordion(article.id)}
                        className="w-full flex items-center gap-4 px-6 py-4 text-left cursor-pointer"
                      >
                        {}
                        <span className="text-xs font-bold text-primary/70 dark:text-secondary-foreground/80 shrink-0 select-none">
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        {}
                        <span
                          className={`flex-1 text-xs sm:text-sm font-semibold text-foreground leading-snug transition-colors group-hover:text-primary dark:group-hover:text-secondary-foreground ${isExpanded ? "text-primary dark:text-secondary-foreground" : ""}`}
                        >
                          {article.question}
                        </span>

                        {}
                        <div className="shrink-0 text-muted-foreground/50 group-hover:text-foreground transition-colors ml-auto">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </button>

                      {}
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-6 pb-4 pt-0">
                            <div className="flex gap-3 ml-6">
                              {}
                              <div className="w-px rounded-full bg-border shrink-0 self-stretch" />
                              {}
                              <div
                                className="flex-1 text-xs text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html: parseMarkdownToHtml(article.answer),
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
