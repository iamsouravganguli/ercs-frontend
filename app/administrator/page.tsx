"use client";
import { useTranslation } from "@/i18n";
import {
  User,
  Shield,
  Scale,
  HelpCircle,
  FileEdit,
  ClipboardList,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GridMenu, GridMenuItem } from "@/components/ui/grid-menu";
import {
  useSummaryMasterStats,
  useSessionCheck,
  useSummaryAccountStats,
  useSummaryCaseStats,
  useCaseStats,
} from "@/lib";
import { StatCardItem, StatCardGrid } from "@/components/ui/stat-card";
import { SectionHeading } from "@/components/ui/section-heading";
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

function AdministratorMenus() {
  const masterStats = useSummaryMasterStats();
  const accountStats = useSummaryAccountStats();
  const caseStats = useSummaryCaseStats();
  const detailedStats = useCaseStats();
  const statsData = detailedStats.data?.result?.data;
  const { t, locale } = useTranslation();
  const lang = locale === "hi" ? "hi" : "en";
  const { data: Session } = useSessionCheck();
  const role = Session?.result?.data.role ?? "";

  const quickMenus: GridMenuItem[] = [
    {
      title: t("administrator.quick.rbac.title"),
      description: t("administrator.quick.rbac.description"),
      icon: <ShieldCheck />,
      href: "/administrator/masters/rbac/roles",
    },
    {
      title: t("administrator.quick.court_master.title"),
      description: t("administrator.quick.court_master.description"),
      icon: <Scale />,
      href: "/administrator/masters/courts",
    },
    {
      title: t("administrator.quick.case_master.title"),
      description: t("administrator.quick.case_master.description"),
      icon: <FileEdit />,
      href: "/administrator/case-master",
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
      title: t("court_menu.account.helpdesk.title"),
      description: t("court_menu.account.helpdesk.description"),
      icon: <HelpCircle />,
      href: "#",
    },
  ];

  const stats: StatCardItem[] = [
    {
      label: t("hero.stats.filed"),
      value: caseStats.data?.result?.data.filed ?? 0,
      sub: t("stats.sub"),
      icon: ClipboardList,
      href: "/manage/cases",
    },
    {
      label: t("hero.stats.disposed"),
      value: caseStats.data?.result?.data.disposed ?? 0,
      sub: t("stats.sub"),
      icon: Scale,
      href: "/manage/cases",
    },
    {
      label: t("hero.stats.pending"),
      value: caseStats.data?.result?.data.pending ?? 0,
      sub: t("stats.sub"),
      icon: ClipboardList,
      href: "/manage/cases",
    },
    {
      label: t("stats.total_roles.label"),
      value: masterStats.data?.result?.data.roles?.active ?? 0,
      change: masterStats.data?.result?.data.roles?.inactive ?? 0,
      sub: t("stats.sub"),
      icon: ShieldCheck,
      href: "/administrator/masters/rbac/roles",
    },
    {
      label: t("stats.total_permissions.label"),
      value: masterStats.data?.result?.data?.permissions?.active ?? 0,
      change: masterStats.data?.result?.data?.permissions?.inactive ?? 0,
      sub: t("stats.sub"),
      icon: ShieldCheck,
      href: "/administrator/masters/rbac/permissions",
    },
    {
      label: t("stats.total_court.label"),
      value: masterStats.data?.result?.data?.courts?.active ?? 0,
      change: masterStats.data?.result?.data?.courts?.inactive ?? 0,
      sub: t("stats.sub"),
      icon: Scale,
      href: "/administrator/masters/courts",
    },
    {
      label: t("stats.total_administrator.label"),
      value: accountStats.data?.result?.data?.SA?.active ?? 0,
      change: accountStats.data?.result?.data?.SA?.inactive ?? 0,
      sub: t("stats.sub"),
      icon: Users,
      href: "/administrator/masters/rbac/users/system",
    },
    {
      label: t("stats.total_citizen.label"),
      value: accountStats.data?.result?.data?.CT?.active ?? 0,
      change: accountStats.data?.result?.data?.CT?.inactive ?? 0,
      sub: t("stats.sub"),
      icon: Users,
      href: "/administrator/masters/rbac/users/citizen",
    },
    {
      label: t("stats.total_advocate.label"),
      value: accountStats.data?.result?.data?.AD?.active ?? 0,
      change: accountStats.data?.result?.data?.AD?.inactive ?? 0,
      sub: t("stats.sub"),
      icon: Users,
      href: "/administrator/masters/rbac/users/court",
    },
    {
      label: t("stats.total_judge.label"),
      value: accountStats.data?.result?.data?.PO?.active ?? 0,
      change: accountStats.data?.result?.data?.PO?.inactive ?? 0,
      sub: t("stats.sub"),
      icon: Users,
      href: "/administrator/masters/rbac/users/court",
    },
    {
      label: t("stats.total_peshkar.label"),
      value: accountStats.data?.result?.data?.CO?.active ?? 0,
      change: accountStats.data?.result?.data?.CO?.inactive ?? 0,
      sub: t("stats.sub"),
      icon: Users,
      href: "/administrator/masters/rbac/users/court",
    },
    {
      label: t("stats.total_clerk.label"),
      value: accountStats.data?.result?.data?.CC?.active ?? 0,
      change: accountStats.data?.result?.data?.CC?.inactive ?? 0,
      sub: t("stats.sub"),
      icon: Users,
      href: "/administrator/masters/rbac/users/court",
    },
    {
      label: t("stats.total_ri.label"),
      value: accountStats.data?.result?.data?.RI?.active ?? 0,
      change: accountStats.data?.result?.data?.RI?.inactive ?? 0,
      sub: t("stats.sub"),
      icon: Users,
      href: "/administrator/masters/rbac/users/court",
    },
    {
      label: t("stats.total_rsi.label"),
      value: accountStats.data?.result?.data?.RSI?.active ?? 0,
      change: accountStats.data?.result?.data?.RSI?.inactive ?? 0,
      sub: t("stats.sub"),
      icon: Users,
      href: "/administrator/masters/rbac/users/court",
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
    <div className="w-full h-full flex flex-col bg-background dark:bg-neutral-950 overflow-hidden">
      {}
      <div className="sticky top-0 z-20 bg-[#dbeafe] dark:bg-slate-900 border-b border-blue-200 dark:border-blue-900 w-full flex flex-row items-center gap-3 px-4 h-14 shrink-0">
        <div className="flex items-center shrink-0 md:hidden">
          <SidebarTrigger />
        </div>
        <span className="font-bold text-base sm:text-lg text-foreground tracking-tight shrink-0">
          {t("brand.admin_title") || "Administrator"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        <SectionHeading title={t("sections.statistics")} />
        <StatCardGrid items={stats} columns={4} role={role} />

        {}
      </div>
    </div>
  );
}

export default AdministratorMenus;
