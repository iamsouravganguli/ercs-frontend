"use client";
import { HeroSectionWebsite } from "@/components/ui/hero-section-website";
import {
  CaseStatsSectionWebsite,
  StatItem,
} from "@/components/ui/case-stats-section-website";
import {
  AppLink,
  ImportantRevenueApplicationsWebsite,
} from "@/components/ui/important-revenue-applications-website";
import {
  FAQItem,
  FAQSectionWebsite,
} from "@/components/ui/faq-section-website";
import {
  CitizenOverviewWebsite,
  Feature,
} from "@/components/ui/citizen-overview-website";
import {
  Holiday,
  NewsHolidaySectionWebsite,
} from "@/components/ui/news-holiday-section-website";
import { useTranslation } from "@/i18n";

import {
  Map,
  MapPinned,
  Layers,
  FileText,
  RefreshCw,
  Scale,
  Bell,
  FilePlus,
  Search,
  ShieldCheck,
  Upload,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useSessionCheck, useSummaryCaseStats, useAnnouncements, getFileUrl } from '@/lib/query';
import { roleSwitch } from "@/utils/role";
export default function HomePage() {
  const { t, locale } = useTranslation();
  const { data } = useSessionCheck();
  const { data: caseStats } = useSummaryCaseStats();

  const [query, setQuery] = useState({
    page: 1,
    limit: 5,
    search: "",
    category: "all",
  });

  const [localSearch, setLocalSearch] = useState(query.search || "");


  useEffect(() => {
    if (query.search !== localSearch) {
      setLocalSearch(query.search || "");
    }
  }, [query.search]);


  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.search !== localSearch) {
        setQuery((prev) => ({
          ...prev,
          search: localSearch,
          page: 1,
        }));
      }
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch]);

  const { data: announcementsData } = useAnnouncements({
    page: query.page,
    limit: query.limit,
    search: query.search,
    ...(query.category && query.category !== "all"
      ? { "filters[category]": query.category }
      : {}),
  });

  const announcementsList = announcementsData?.result?.data || [];
  const pagination = announcementsData?.result?.pagination as any;

  const newsItems = useMemo(() => {
    return announcementsList.map((item: any) => ({
      type: item.category,
      docNumber: "",
      title: item.title,
      description: "",
      date: item.created_at
        ? (() => {
            const d = new Date(item.created_at);
            const pad = (n: number) => n.toString().padStart(2, "0");
            const yyyy = d.getFullYear();
            const mm = pad(d.getMonth() + 1);
            const dd = pad(d.getDate());
            const hours = d.getHours();
            const minutes = pad(d.getMinutes());
            const ampm = hours >= 12 ? "PM" : "AM";
            const hour12 = pad(hours % 12 || 12);
            return `${yyyy}-${mm}-${dd} ${hour12}:${minutes} ${ampm}`;
          })()
        : item.date,
      docUrl: item.doc_url ? getFileUrl(item.doc_url) : "",
      externalUrl: item.external_url || "",
      pinned: item.pinned,
    }));
  }, [announcementsList]);

  const statsData = caseStats?.result?.data;
  const faqList: FAQItem[] = Array.from({ length: 6 }, (_, i) => {
    const index = i + 1;

    return {
      question: t(`faq.q${index}`),
      answer: t(`faq.a${index}`),
    };
  });

  const applications: AppLink[] = [
    {
      title: t("revenue_apps.bhulekh.title"),
      description: t("revenue_apps.bhulekh.description"),
      url: "https://ebhulekh.uk.gov.in",
      icon: <Map className="w-4 h-4" />,
    },
    {
      title: t("revenue_apps.bhunaksha.title"),
      description: t("revenue_apps.bhunaksha.description"),
      url: "https://ebhunaksha.uk.gov.in",
      icon: <MapPinned className="w-4 h-4" />,
    },
    {
      title: t("revenue_apps.land_use.title"),
      description: t("revenue_apps.land_use.description"),
      url: "https://ebhuanumati.uk.gov.in",
      icon: <Layers className="w-4 h-4" />,
    },
    {
      title: t("revenue_apps.eregistration.title"),
      description: t("revenue_apps.eregistration.description"),
      url: "https://portal.eregistrationukgov.in",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      title: t("revenue_apps.mutation.title"),
      description: t("revenue_apps.mutation.description"),
      url: "https://portal.eregistrationukgov.in",
      icon: <RefreshCw className="w-4 h-4" />,
    },
    {
      title: t("revenue_apps.rcms.title"),
      description: t("revenue_apps.rcms.description"),
      url: "#",
      icon: <Scale className="w-4 h-4" />,
    },
  ];

  const features: Feature[] = [
    {
      icon: FilePlus,
      title: t("citizen_overview.feature1"),
      description: t("citizen_overview.feature1_desc"),
    },
    {
      icon: Search,
      title: t("citizen_overview.feature2"),
      description: t("citizen_overview.feature2_desc"),
    },
    {
      icon: Upload,
      title: t("citizen_overview.feature3"),
      description: t("citizen_overview.feature3_desc"),
    },
    {
      icon: Bell,
      title: t("citizen_overview.feature4"),
      description: t("citizen_overview.feature4_desc"),
    },
    {
      icon: FileText,
      title: t("citizen_overview.feature5"),
      description: t("citizen_overview.feature5_desc"),
    },
    {
      icon: ShieldCheck,
      title: t("citizen_overview.feature6"),
      description: t("citizen_overview.feature6_desc"),
    },
  ];

  const UTTARAKHAND_HOLIDAYS_2026: Holiday[] = [
    { date: "2026-01-01", name: "New Year Holiday", nameHi: "नव वर्ष अवकाश" },
    { date: "2026-01-26", name: "Republic Day", nameHi: "गणतंत्र दिवस" },
    { date: "2026-02-15", name: "Maha Shivratri", nameHi: "महाशिवरात्रि" },
    { date: "2026-03-03", name: "Holi", nameHi: "होली" },
    { date: "2026-03-04", name: "Holi", nameHi: "होली" },
    {
      date: "2026-03-21",
      name: "Id-ul-Fitr (Eid ul-Fitr) *",
      nameHi: "ईद उल-फितर *",
    },
    { date: "2026-03-26", name: "Ram Navami", nameHi: "राम नवमी" },
    { date: "2026-03-31", name: "Mahavir Jayanti", nameHi: "महावीर जयंती" },
    { date: "2026-04-03", name: "Good Friday", nameHi: "गुड फ्राइडे" },
    { date: "2026-04-14", name: "Vaisakhi", nameHi: "बैसाखी" },
    {
      date: "2026-04-14",
      name: "Ambedkar Jayanti",
      nameHi: "डॉ. अंबेडकर जयंती",
    },
    { date: "2026-05-01", name: "Buddha Purnima", nameHi: "बुद्ध पूर्णिमा" },
    {
      date: "2026-05-27",
      name: "Id-ul-Zuha / Eid ul-Adha (Bakrid) *",
      nameHi: "ईद उल-अज़हा (बकरीद) *",
    },
    { date: "2026-06-26", name: "Muharram *", nameHi: "मुहर्रम *" },
    { date: "2026-08-15", name: "Independence Day", nameHi: "स्वतंत्रता दिवस" },
    {
      date: "2026-08-26",
      name: "Barawafat / Milad-un-Nabi *",
      nameHi: "बारावफात / ईद-ए-मिलाद *",
    },
    { date: "2026-08-28", name: "Raksha Bandhan", nameHi: "रक्षाबंधन" },
    { date: "2026-09-04", name: "Janmashtami", nameHi: "जन्माष्टमी" },
    {
      date: "2026-10-02",
      name: "Mahatma Gandhi Jayanti",
      nameHi: "महात्मा गांधी जयंती",
    },
    {
      date: "2026-10-19",
      name: "Dussehra (Vijay Dashami)",
      nameHi: "दशहरा (विजयदशमी)",
    },
    {
      date: "2026-10-20",
      name: "Dussehra (Vijay Dashami)",
      nameHi: "दशहरा (विजयदशमी)",
    },
    { date: "2026-11-08", name: "Deepawali", nameHi: "दीपावली" },
    { date: "2026-11-09", name: "Deepawali", nameHi: "दीपावली" },
    { date: "2026-11-10", name: "Deepawali", nameHi: "दीपावली" },
    {
      date: "2026-11-24",
      name: "Guru Nanak Jayanti / Kartik Purnima",
      nameHi: "गुरु नानक जयंती / कार्तिक पूर्णिमा",
    },
    { date: "2026-12-25", name: "Christmas", nameHi: "क्रिसमस" },
    { date: "2026-12-26", name: "Christmas Holiday", nameHi: "क्रिसमस अवकाश" },
    { date: "2026-12-27", name: "Christmas Holiday", nameHi: "क्रिसमस अवकाश" },
    { date: "2026-12-28", name: "Christmas Holiday", nameHi: "क्रिसमस अवकाश" },
    { date: "2026-12-29", name: "Christmas Holiday", nameHi: "क्रिसमस अवकाश" },
    { date: "2026-12-30", name: "Christmas Holiday", nameHi: "क्रिसमस अवकाश" },
    { date: "2026-12-31", name: "Christmas Holiday", nameHi: "क्रिसमस अवकाश" },
  ];
  const caseStatsList: StatItem[] = [
    {
      label: t("hero.stats.filed"),
      value: statsData?.filed ?? 0,
      icon: <FileText className="w-4 h-4" />,
      iconBg:
        "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
    },
    {
      label: t("hero.stats.disposed"),
      value: statsData?.disposed ?? 0,
      icon: <CheckCircle2 className="w-4 h-4" />,
      iconBg:
        "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("hero.stats.pending"),
      value: statsData?.pending ?? 0,
      icon: <Clock className="w-4 h-4" />,
      iconBg:
        "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div>
      <HeroSectionWebsite
        loginText={t("hero.actions.signin")}
        registerText={t("hero.actions.signup")}
        dashboardText={t("hero.actions.dashboard")}
        loginHref="/identity/signin"
        registerHref="/identity/signup"
        dashboardHref={roleSwitch(data?.result?.data?.role || "")}
        isAuthenticated={data?.result?.data.is_authenticated}
      />

      <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-zinc-950 border-t border-blue-100/50 dark:border-blue-900/30">
        <CaseStatsSectionWebsite
          sectionTitle={t("hero.stats.title")}
          sectionSubtitle={t("hero.stats.subtitle")}
          stats={caseStatsList}
        />
      </div>

      <div className="bg-white dark:bg-background border-t border-zinc-100 dark:border-zinc-800/50">
        <CitizenOverviewWebsite
          sectionTitle={t("citizen_overview.title")}
          sectionSubtitle={t("citizen_overview.subtitle")}
          features={features}
        />
      </div>

      <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-white dark:from-amber-950/20 dark:via-orange-950/15 dark:to-zinc-950 border-t border-amber-100/50 dark:border-amber-900/20">
        <NewsHolidaySectionWebsite
          newsItems={newsItems}
          searchPlaceholder={t("announcement.search_placeholder")}
          holidaySectionTitle={t("announcement.holiday.title")}
          holidaySectionSubtitle={t("announcement.holiday.subtitle")}
          newsSectionTitle={t("announcement.news.title")}
          newsSectionSubtitle={t("announcement.news.subtitle")}
          noNewsText={t("announcement.news.no_news")}
          pinnedText={t("announcement.news.pinned")}
          daysText={t("announcement.holiday.days")}
          todayText={t("announcement.holiday.today")}
          inDaysText={t("announcement.holiday.in_days")}
          resultsText={t("announcement.news.results")}
          viewAllText={t("announcement.news.view_all")}
          noResultsText={t("announcement.news.no_results")}
          tomorrowText={t("announcement.holiday.tomorrow")}
          upcomingHolidaysText={t("announcement.holiday.upcoming")}
          holidays={UTTARAKHAND_HOLIDAYS_2026}
          lang={locale === "hi" ? "hi" : "en"}
          locale={locale}
          currentPage={query.page}
          totalPages={pagination?.total_pages || 1}
          totalResults={pagination?.total || 0}
          onPageChange={(page) => setQuery({ ...query, page })}
          searchValue={localSearch}
          onSearchChange={setLocalSearch}
          categoryValue={query.category || "all"}
          onCategoryChange={(category) =>
            setQuery({ ...query, category, page: 1 })
          }
        />
      </div>

      <div className="bg-gradient-to-b from-slate-50 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border-t border-zinc-200/50 dark:border-zinc-800">
        <FAQSectionWebsite
          title={t("faq.title")}
          subtitle={t("faq.subtitle")}
          faqs={faqList}
        />
      </div>

      <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white dark:from-emerald-950/20 dark:via-teal-950/15 dark:to-zinc-950 border-t border-emerald-100/50 dark:border-emerald-900/20">
        <ImportantRevenueApplicationsWebsite
          applications={applications}
          sectionTitle={t("revenue_apps.title")}
          sectionSubtitle={t("revenue_apps.subtitle")}
          dialogTitle={t("revenue_apps.external_redirect.title")}
          dialogDescription={t("revenue_apps.external_redirect.description")}
          continueText={t("common_button.continue.label")}
          cancelText={t("common_button.cancel.label")}
        />
      </div>
    </div>
  );
}
