"use client";
import { useIsFetching } from "@tanstack/react-query";
import { AppLoader } from "@/components/ui/app-loader";
import { useEffect, useState } from "react";


const IGNORE_KEYS = [
  "SESSION_CHECK",
  "COURT_LIST_MASTER_DROPDOWN",
  "STATE_LIST",
  "MANDAL_LIST",
  "DISTRICT_LIST",
  "TEHSIL_LIST",
  "QUICK_SEARCH",
  "STATUS_LIST",
  "COMMUNICATION_TYPE_LIST",
  "NOTICE_TEMPLATE_LIST",
  "SERVICE_MODE_LIST",
  "RECEIVER_RELATION_LIST",
  "MASTER_STATS",
  "CASE_STATS",
  "ACCOUNT_STATS",
  "USER_LIST",

  "CASE_LIST",
  "PUBLIC_CASE_LIST",
  "CASE_SEARCH",
  "CASE_TIMELINE",
  "TIMELINE",
  "DASHBOARD",
];

export function QueryLoader() {
  const fetchingCount = useIsFetching({
    predicate: (query) => {
      const key = query.queryKey?.[0] as string;
      const isIgnored = IGNORE_KEYS.includes(key);
      const isInitialFetch = query.state.status === "pending";
      if (
        process.env.NODE_ENV === "development" &&
        !isIgnored &&
        isInitialFetch
      ) {
        console.warn(
          "QueryLoader active query blocking screen:",
          key,
          query.queryKey,
        );
      }
      return !isIgnored && isInitialFetch;
    },
  });

  const mutatingCount = 0;

  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const update = () => setPageLoading(!!(window as any).__nextPageLoading);
      update();
      const handlePageLoading = () => update();
      window.addEventListener(
        "nextjs:pageLoading",
        handlePageLoading as EventListener,
      );
      const interval = setInterval(update, 500);
      return () => {
        window.removeEventListener(
          "nextjs:pageLoading",
          handlePageLoading as EventListener,
        );
        clearInterval(interval);
      };
    }
  }, []);

  const isActive = (fetchingCount > 0 || mutatingCount > 0) && !pageLoading;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && !visible) {
      timer = setTimeout(() => setVisible(true), 200);
    } else if (!isActive) {
      setVisible(false);
    }
    return () => clearTimeout(timer);
  }, [isActive, visible]);

  if (!visible) return null;


  return <AppLoader variant="overlay" />;
}
