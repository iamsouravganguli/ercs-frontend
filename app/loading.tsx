"use client";

import { useEffect } from "react";
import { AppLoader } from "@/components/ui/app-loader";

export default function PageLoader() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__nextPageLoading = true;
    }
    return () => {
      if (typeof window !== "undefined") {
        (window as any).__nextPageLoading = false;
      }
    };
  }, []);

  return <AppLoader variant="fullscreen" phase="connecting" />;
}
