"use client";

import { LanguageProvider } from "@/i18n";
import { PageLoader } from "./page-loader";
import { QueryLoader } from "./query-loader";
import { QueryParamsProviders } from "./query-params";
import { ReactQueryProviders } from "./react-query-provider";
import { ThemeSwitcherProviders } from "./theme-switcher-provider";
import { ConfirmProvider } from "./confirm-provider";
import { OtpProvider } from "./otp-provider";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { HindiKeyboardProvider } from "@/components/ui/hindi-keyboard";
export * from "use-query-params";
export * from "./confirm-provider";
export * from "./otp-provider";
export { queryClient } from "./react-query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <HindiKeyboardProvider>
        <QueryParamsProviders>
          <ReactQueryProviders>
            <QueryLoader />
            <ThemeSwitcherProviders>
              <LanguageProvider>
                <ConfirmProvider>
                  <OtpProvider>{children}</OtpProvider>
                </ConfirmProvider>
              </LanguageProvider>
            </ThemeSwitcherProviders>
            <Toaster />
          </ReactQueryProviders>
        </QueryParamsProviders>
      </HindiKeyboardProvider>
    </Suspense>
  );
}
