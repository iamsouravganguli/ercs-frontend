
"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n";
import { useSessionCheck, useSummaryCaseStats, useCaseStats, useCaseList } from '@/lib/query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Scale,
  ClipboardList,
  FileText,
  FileEdit,
  XCircle,
  CalendarDays,
  ChevronRight,
} from "lucide-react";

export default function ManageDashboard() {
  const { t, locale } = useTranslation();
  const lang = locale === "hi" ? "hi" : "en";
  const { data: sessionData } = useSessionCheck();
  const role = sessionData?.result?.data?.role ?? "";
  const courtId = (sessionData?.result?.data as any)?.court;
  const isCitizenAdvocate = ["CT", "AD", "CT", "AD"].includes(
    (role || "").toUpperCase(),
  );

  const caseStats = useSummaryCaseStats(
    isCitizenAdvocate ? undefined : courtId ? { court_id: courtId } : undefined,
  );
  const detailedStats = useCaseStats(
    isCitizenAdvocate ? undefined : courtId ? { court_id: courtId } : undefined,
  );
  const statsData: any = detailedStats.data?.result?.data;
  const { data: caseListData } = useCaseList({ limit: 5 } as any);
  const recentCases: any[] =
    (caseListData?.result?.data as any) ||
    (caseListData as any)?.result?.data ||
    [];

  const isStatsLoading = caseStats.isLoading || detailedStats.isLoading;
  const stats = [
    {
      label: t("dashboard.stats.draft"),
      value: (caseStats.data?.result?.data as any)?.draft ?? 0,
      sub: isCitizenAdvocate ? t("dashboard.stats.sub_your_drafts") : t("dashboard.stats.sub_draft"),
      icon: FileEdit,
      href: "/manage/cases",
      accent: "bg-zinc-500 text-white",
    },
    {
      label: t("hero.stats.filed") || "Cases Filed",
      value: (caseStats.data?.result?.data as any)?.filed ?? 0,
      sub: isCitizenAdvocate ? t("dashboard.stats.sub_your_cases") : t("dashboard.stats.sub_total"),
      icon: ClipboardList,
      href: "/manage/cases",
      accent: "bg-blue-600 text-white",
    },
    {
      label: t("hero.stats.pending") || "Pending",
      value: (caseStats.data?.result?.data as any)?.pending ?? 0,
      sub: isCitizenAdvocate ? t("dashboard.stats.sub_your_pending") : t("dashboard.stats.sub_pending"),
      icon: Scale,
      href: "/manage/cases",
      accent: "bg-amber-500 text-white",
    },
    {
      label: t("hero.stats.disposed") || "Disposed",
      value: (caseStats.data?.result?.data as any)?.disposed ?? 0,
      sub: isCitizenAdvocate ? t("dashboard.stats.sub_your_disposed") : t("dashboard.stats.sub_disposed"),
      icon: FileText,
      href: "/manage/cases",
      accent: "bg-emerald-600 text-white",
    },
    {
      label: t("dashboard.stats.rejected"),
      value: (caseStats.data?.result?.data as any)?.rejected ?? 0,
      sub: isCitizenAdvocate ? t("dashboard.stats.sub_your_rejected") : t("dashboard.stats.sub_rejected"),
      icon: XCircle,
      href: "/manage/cases",
      accent: "bg-red-600 text-white",
    },
    {
      label: t("dashboard.stats.hearings"),
      value: statsData?.pending_hearings ?? statsData?.awaiting_review ?? 0,
      sub: isCitizenAdvocate ? t("dashboard.stats.sub_your_hearings") : t("dashboard.stats.sub_scheduled"),
      icon: CalendarDays,
      href: "/manage/cases",
      accent: "bg-indigo-600 text-white",
    },
  ];

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#f43f5e",
    "#84cc16",
  ];
  const chartData = (statsData?.stages || []).map((s: any, i: number) => ({
    name: lang === "hi" ? s.name : s.name_en,
    value: s.count ?? 0,
    fill: COLORS[i % COLORS.length],
  }));
  const chartConfig = (statsData?.stages || []).reduce(
    (acc: any, s: any, i: number) => {
      const k = lang === "hi" ? s.name : s.name_en;
      acc[k] = { label: k, color: COLORS[i % COLORS.length] };
      return acc;
    },
    {},
  );
  const c = caseStats.data?.result?.data as any;
  const overallData = [
    {
      name: t("dashboard.stats.draft"),
      value: c?.draft ?? 0,
      fill: "#64748b",
    },
    {
      name: t("hero.stats.pending") || "Pending",
      value: c?.pending ?? 0,
      fill: "#f59e0b",
    },
    {
      name: t("hero.stats.disposed") || "Disposed",
      value: c?.disposed ?? 0,
      fill: "#10b981",
    },
    {
      name: t("dashboard.stats.rejected"),
      value: c?.rejected ?? 0,
      fill: "#ef4444",
    },
  ].filter((d: any) => d.value > 0);
  const overallConfig = overallData.reduce((acc: any, d) => {
    acc[d.name] = { label: d.name, color: d.fill };
    return acc;
  }, {} as any);
  const totalStageCount = chartData.reduce(
    (a: number, b: any) => a + (b.value || 0),
    0,
  );
  const totalOverall = overallData.reduce(
    (a: number, b: any) => a + (b.value || 0),
    0,
  );
  const monthlyData = (c?.monthly_trend ?? []) as any[];
  const monthlyConfig = {
    count: { label: t("dashboard.stats.filed_label"), color: "#3b82f6" },
  } as any;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
      <div className="shrink-0 h-14 flex items-center px-6 bg-white dark:bg-background sticky top-0 z-20 backdrop-blur-sm rounded-t-lg">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          {t("header.dashboard") || "Dashboard"}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-6 bg-white dark:bg-background">
        <div className="w-full space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isStatsLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card
                    key={i}
                    className="p-5 flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white dark:bg-zinc-900 dark:border-zinc-800/50 shadow-none"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-2 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                      <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                    </div>
                  </Card>
                ))
              : stats.map((s) => (
                  <Link key={s.label} href={s.href} className="block group">
                    <Card className="relative overflow-hidden p-5 flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white dark:bg-zinc-900 dark:border-zinc-800/50 shadow-none hover:shadow-sm hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 leading-none">
                            {s.label}
                          </p>
                          <p className="text-3xl font-bold tracking-tight leading-none text-zinc-900 dark:text-white">
                            {s.value ?? "—"}
                          </p>
                        </div>
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 shadow-sm ring-1 ring-black/5 ${s.accent} group-hover:scale-105 transition-transform`}
                        >
                          <s.icon className="h-5 w-5" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {isStatsLoading ? (
              <>
                <Card className="flex flex-col border border-zinc-100 dark:border-zinc-800/50 shadow-none bg-white dark:bg-zinc-900">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56 mt-2" />
                  </CardHeader>
                  <CardContent className="pt-2">
                    <Skeleton className="h-[280px] w-full rounded-xl" />
                  </CardContent>
                </Card>
                <Card className="flex flex-col border border-zinc-100 dark:border-zinc-800/50 shadow-none bg-white dark:bg-zinc-900">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56 mt-2" />
                  </CardHeader>
                  <CardContent className="pt-2">
                    <Skeleton className="h-[280px] w-full rounded-xl" />
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {chartData.length > 0 && (
                  <Card className="flex flex-col border border-zinc-100 dark:border-zinc-800/50 shadow-none bg-white dark:bg-zinc-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {t("sections.case_stages_breakdown") ||
                          "Case Stages Breakdown"}
                      </CardTitle>
                      <CardDescription>
                        {t("sections.case_stages_breakdown_desc") ||
                          "Distribution of cases across stages"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ChartContainer
                        config={chartConfig}
                        className="h-[280px] w-full"
                      >
                        <BarChart
                          data={chartData}
                          layout="vertical"
                          margin={{ left: 24, right: 16, top: 8, bottom: 8 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            className="stroke-zinc-100 dark:stroke-zinc-800"
                          />
                          <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                            allowDecimals={false}
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={90}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                          />
                          <ChartTooltip
                            cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                            content={<ChartTooltipContent hideLabel />}
                          />
                          <Bar
                            dataKey="value"
                            radius={[0, 8, 8, 0]}
                            barSize={18}
                          >
                            {chartData.map((e: any, i: number) => (
                              <Cell key={i} fill={e.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                      <p className="text-center text-xs text-muted-foreground mt-2">
                        {t("dashboard.stats.total")}: {totalStageCount}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {overallData.length > 0 && (
                  <Card className="flex flex-col border border-zinc-100 dark:border-zinc-800/50 shadow-none bg-white dark:bg-zinc-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{t("dashboard.stats.status_wise_title")}</CardTitle>
                      <CardDescription>{t("dashboard.stats.status_wise_desc")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ChartContainer
                        config={overallConfig}
                        className="h-[280px] w-full"
                      >
                        <BarChart
                          data={overallData}
                          margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            className="stroke-zinc-100 dark:stroke-zinc-800"
                          />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                            interval={0}
                            angle={-12}
                            dy={10}
                            height={40}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                            allowDecimals={false}
                          />
                          <ChartTooltip
                            cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                            content={<ChartTooltipContent hideLabel />}
                          />
                          <Bar
                            dataKey="value"
                            radius={[8, 8, 0, 0]}
                            barSize={28}
                          >
                            {overallData.map((e: any, i: number) => (
                              <Cell key={i} fill={e.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                      <p className="text-center text-xs text-muted-foreground mt-2">
                        {t("dashboard.stats.total")}: {totalOverall}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          <Card className="rounded-2xl border border-zinc-100 dark:border-zinc-800/50 shadow-none bg-white dark:bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {t("dashboard.stats.monthly_title")}
              </CardTitle>
              <CardDescription>{t("dashboard.stats.monthly_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {isStatsLoading ? (
                <Skeleton className="h-75 w-full rounded-xl" />
              ) : monthlyData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
                  No trend data
                </p>
              ) : (
                <ChartContainer
                  config={monthlyConfig}
                  className="h-75 w-full"
                >
                  <LineChart
                    data={monthlyData}
                    margin={{ left: 12, right: 16, top: 12, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-zinc-100 dark:stroke-zinc-800"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      dy={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 2, fill: "#3b82f6" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border border-zinc-100 dark:border-zinc-800/50 shadow-none bg-white dark:bg-zinc-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest case activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {detailedStats.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2"
                      >
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : (statsData?.recent_activities || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
                    No recent activity
                  </p>
                ) : (
                  (statsData.recent_activities as any[])
                    .slice(0, 5)
                    .map((a: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-800/30"
                      >
                        <p className="text-sm font-medium truncate">
                          {a.title || a.action || "Activity"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {a.description || a.case_number || ""}
                        </p>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-zinc-100 dark:border-zinc-800/50 shadow-none bg-white dark:bg-zinc-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Recent Cases
                </CardTitle>
                <CardDescription>Latest 5 cases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {caseStats.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-900 space-y-2"
                      >
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : recentCases.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
                    No recent cases
                  </p>
                ) : (
                  recentCases.slice(0, 5).map((c: any) => (
                    <Link
                      key={c.case_number || c.id}
                      href={
                        c.case_number
                          ? `/case/${c.case_number}`
                          : "/manage/cases"
                      }
                      className="flex items-center justify-between rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors bg-white dark:bg-zinc-900 group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {c.case_number || c.title || "Case"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.current_status_detail?.name_en || c.status || ""}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                    </Link>
                  ))
                )}
                <Link href="/manage/cases">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 rounded-xl"
                  >
                    View All Cases
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
