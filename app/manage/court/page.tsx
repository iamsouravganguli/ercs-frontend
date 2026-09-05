"use client";
import { useTranslation } from "@/i18n";
import {
  User,
  Shield,
  Scale,
  Users,
  IndianRupee,
  MessageCircleQuestion,
  AlertCircle,
  Calendar,
  ClipboardList,
  Mail,
  Upload,
} from "lucide-react";
import { useSessionCheck, useSummaryCaseStats, useCaseStats } from '@/lib/query';

import { StatCardItem, StatCardGrid } from "@/components/ui/stat-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { GridMenu, GridMenuItem } from "@/components/ui/grid-menu";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  PieChart,
  Pie,
  Cell,
} from "@/components/ui/chart";

function CourtMainMenus() {
  const { t, locale } = useTranslation();

  const { data: Session } = useSessionCheck();
  const role = Session?.result?.data.role ?? "";
  const courtId = Session?.result?.data.court;

  const caseStats = useSummaryCaseStats({ court_id: courtId });
  const detailedStats = useCaseStats({ court_id: courtId });
  const statsData = detailedStats.data?.result?.data;
  const lang = locale === "hi" ? "hi" : "en";

  const quickMenus: GridMenuItem[] = [
    {
      title: t("court_menu.quick.cases.title") || "Cases",
      description:
        t("court_menu.quick.cases.description") ||
        "Easily file, find, and manage your cases",
      icon: <Scale />,
      href: "/manage/cases",
    },
  ];

  const accountMenus: GridMenuItem[] = [
    {
      title: t("court_menu.account.security.title"),
      description: t("court_menu.account.security.description"),
      icon: <Shield />,
      href: "/identity/profile/security",
    },
    {
      title: t("court_menu.account.my_account.title"),
      description: t("court_menu.account.my_account.description"),
      icon: <User />,
      href: "/identity/profile/details",
    },
    {
      title: t("court_menu.quick.court_users.title") || "Court Users",
      description:
        t("court_menu.quick.court_users.description") ||
        "Manage court users and access",
      icon: <Users />,
      href: "/manage/settings/court/users",
    },
    {
      title: t("court_menu.account.helpdesk.title"),
      description: t("court_menu.account.helpdesk.description"),
      icon: <MessageCircleQuestion />,
      href: "#",
    },
  ];

  const stats: StatCardItem[] = [

    {
      label: t("hero.stats.total_cases"),
      value:
        (caseStats.data?.result?.data as any)?.total ??
        (caseStats.data?.result?.data.filed ?? 0) +
          (caseStats.data?.result?.data.disposed ?? 0),
      change: "0",
      sub: t("stats.sub"),
      icon: ClipboardList,
      href: "/manage/cases",
    },
    {
      label: t("hero.stats.disposed"),
      value: caseStats.data?.result?.data.disposed ?? 0,
      change: "0",
      sub: t("stats.sub"),
      icon: Scale,
      href: "/manage/cases",
    },
    {
      label: t("hero.stats.pending"),
      value: caseStats.data?.result?.data.pending ?? 0,
      change: "0",
      sub: t("stats.sub"),
      icon: ClipboardList,
      href: "/manage/cases",
    },
    {
      label: "Registered users",
      value: "0",
      change: "0",
      sub: "this month",
      icon: Users,
      href: "/identity/profile/details",
    },

    {
      label: "My cases",
      value: statsData?.my_cases ?? 0,
      change: "0",
      sub: "this week",
      icon: Scale,
      href: "/manage/cases",
    },
    {
      label: "Orders pending",
      value: statsData?.orders_pending ?? 0,
      change: "0",
      sub: "vs yesterday",
      icon: ClipboardList,
      href: "/manage/cases",
    },

    {
      label: "Filings today",
      value: statsData?.filings_today ?? 0,
      change: "0",
      sub: "vs yesterday",
      icon: Upload,
      href: "/manage/cases",
    },
    {
      label: "Awaiting review",
      value: statsData?.awaiting_review ?? 0,
      change: "0",
      sub: "action needed",
      icon: AlertCircle,
      allowedRoles: ["clerk"],
      href: "/manage/cases",
    },
    {
      label: "Issued summons",
      value: statsData?.issued_summons ?? 0,
      sub: "today",
      icon: Mail,
      href: "/manage/cases",
    },

    {
      label: "Pending hearings",
      value: statsData?.pending_hearings ?? 0,
      change: "0",
      sub: "requires attention",
      icon: Calendar,
      href: "/manage/cases",
    },
    {
      label: "Fees collected",
      value: "0",
      change: "0",
      trend: "neutral",
      sub: "this week",
      icon: IndianRupee,
      href: "/manage/cases",
    },
  ];

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-1, 217 91% 60%))",
    "hsl(var(--chart-2, 142 72% 29%))",
    "hsl(var(--chart-3, 31 97% 55%))",
    "hsl(var(--chart-4, 292 84% 61%))",
    "hsl(var(--chart-5, 173 58% 39%))",
    "hsl(var(--chart-6, 196 90% 35%))",
    "hsl(var(--chart-7, 43 96% 56%))",
    "hsl(var(--chart-8, 8 80% 56%))",
  ];

  const chartData = (statsData?.stages || [])
    .filter((stage: any) => stage.count > 0)
    .map((stage: any, index: number) => ({
      name: lang === "hi" ? stage.name : stage.name_en,
      value: stage.count,
      fill: COLORS[index % COLORS.length],
    }));

  const chartConfig = (statsData?.stages || []).reduce(
    (acc: any, stage: any, index: number) => {
      const key = lang === "hi" ? stage.name : stage.name_en;
      acc[key] = {
        label: key,
        color: COLORS[index % COLORS.length],
      };
      return acc;
    },
    {},
  );

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
      <div className="shrink-0 h-14 flex items-center px-6 bg-white dark:bg-background sticky top-0 z-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Court</h2>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 bg-white dark:bg-background">
        <div className="w-full space-y-6 max-w-5xl mx-auto">
          <SectionHeading title={t("sections.statistics")} />
          <StatCardGrid items={stats} columns={4} role={role} />

          {}
        </div>
      </div>
    </div>
  );
}

export default CourtMainMenus;
