"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./(steps)/app-sidebar";
import { AppHeader } from "./(steps)/app-header";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCaseDetail, useSessionCheck } from '@/lib/query';
import { useQueryClient } from "@tanstack/react-query";

function CaseRootLayout({ children }: { children: React.ReactNode }) {
  const session = useSessionCheck();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const caseNumber = params?.case_number as string;

  const queryClient = useQueryClient();

  const { data: caseDetailRes } = useCaseDetail(caseNumber);
  const caseData = caseDetailRes?.result?.data;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "refetch-timeline") {
        queryClient.invalidateQueries({
          queryKey: ["CASE_DETAIL", caseNumber],
        });
        queryClient.invalidateQueries({
          queryKey: ["CASE_TIMELINE", caseNumber],
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [caseNumber, queryClient]);

  const roleStr = session.data?.result?.data?.role as string;
  const isCourtUser = ["PO", "CO", "CC", "SA", "RI", "RSI"].includes(
    roleStr?.toUpperCase() || "",
  );

  useEffect(() => {
    if (!caseData || !pathname || !router) return;

    const isDraft = caseData.is_submitted === false;

    if (isDraft && !isCourtUser) {
      const postSubmissionRoutes = [
        "/notices",
        "/hearing",
        "/order",
        "/execution",
        "/close",
      ];

      const isPostSubmissionRoute = postSubmissionRoutes.some((route) =>
        pathname.includes(route),
      );

      if (isPostSubmissionRoute) {
        router.replace(`/case/${caseNumber}/review`);
      }
    }
  }, [caseData, pathname, caseNumber, router, isCourtUser]);

  const isAuthenticated = session.data?.result?.data?.is_authenticated === true;

  useEffect(() => {
    if (!pathname || !router || !caseNumber) return;
    if (session.isQueryPending) return;


    if (!isAuthenticated && !pathname.includes("/public")) {
      router.replace(`/case/${caseNumber}/public`);
    }
  }, [isAuthenticated, session.isQueryPending, pathname, caseNumber, router]);

  if (pathname?.includes("/public")) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-neutral-950 overflow-y-auto print:h-auto print:min-h-0 print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
        {children}
      </div>
    );
  }

  const isPopup =
    pathname?.includes("/parties/add") ||
    pathname?.includes("/parties/edit") ||
    pathname?.includes("/lands/add") ||
    pathname?.includes("/lands/edit") ||
    pathname?.includes("/documents/add") ||
    pathname?.includes("/notices/add") ||
    pathname?.includes("/payments/view") ||
    pathname?.includes("/hearing/add") ||
    pathname?.includes("/hearing/edit") ||
    pathname?.includes("/hearing/view");

  if (isPopup) {
    return (
      <div className="bg-background h-screen w-full overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true} className="bg-background">
      <div className="flex h-screen w-full overflow-hidden">
        {}
        <AppSidebar role={roleStr} />

        {}
        <div className="flex flex-1 flex-col h-screen overflow-hidden">
          <AppHeader role={roleStr} />
          <SidebarInset className="bg-background dark:bg-neutral-950 overflow-auto flex-1">
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default CaseRootLayout;
