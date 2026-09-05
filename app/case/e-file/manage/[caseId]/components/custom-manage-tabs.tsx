"use client";
import { useParams, usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/i18n";

const tabs = [
  { key: "overview", labelKey: "case.manage.tabs.overview", fallback: "Overview" },
  { key: "case-details", labelKey: "case.manage.tabs.case_details", fallback: "Case Details" },
  { key: "documents", labelKey: "case.manage.tabs.documents", fallback: "Documents" },
  { key: "communications", labelKey: "case.manage.tabs.communications", fallback: "Communications" },
  { key: "hearing", labelKey: "case.manage.tabs.hearing", fallback: "Hearing" },
  { key: "orders", labelKey: "case.manage.tabs.orders", fallback: "Orders" },
  { key: "fees", labelKey: "case.manage.tabs.fees", fallback: "Payments" },
] as const;

export function CustomManageTabs() {
  const { caseId } = useParams<{ caseId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const activeKey = (() => {
    if (pathname?.includes("/documents")) return "documents";
    if (pathname?.includes("/fees")) return "fees";
    if (pathname?.includes("/communications")) return "communications";
    if (pathname?.includes("/hearing")) return "hearing";
    if (pathname?.includes("/orders")) return "orders";
    if (pathname?.includes("/case-details")) return "case-details";
    if (pathname?.includes("/overview")) return "overview";
    return "overview";
  })();

  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden scrollbar-none whitespace-nowrap overscroll-x-contain touch-pan-x flex-nowrap px-1 pt-1.5">
        {tabs.map((tab) => {
          const isActive = activeKey === tab.key;
          const href = `/case/e-file/manage/${caseId}/${tab.key}`;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => router.push(href)}
              className={cn(
                "h-10 px-4 text-sm font-medium whitespace-nowrap border-b-[3px] -mb-px transition-colors shrink-0",
                isActive ? "border-primary text-primary dark:border-white dark:text-white" : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600",
              )}
            >
              {t(tab.labelKey as any, { defaultValue: tab.fallback } as any) as string}
            </button>
          );
        })}
      </div>
    </div>
  );
}
