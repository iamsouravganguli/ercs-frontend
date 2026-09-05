"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";

const THEME_KEY = "portal-theme";

type ThemeType = "light" | "dark" | "system";

const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? null;

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? match.split("=")[1] : null;
}

export function ThemeSwitcherProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const storedTheme = (getCookie(THEME_KEY) as ThemeType | null) ?? "light";

    const isIp = COOKIE_DOMAIN
      ? /^\d+\.\d+\.\d+\.\d+$/.test(COOKIE_DOMAIN)
      : true;

    const domainPart =
      COOKIE_DOMAIN && !isIp ? `; domain=${COOKIE_DOMAIN}` : "";

    document.cookie = `${THEME_KEY}=${storedTheme}; path=/${domainPart}; max-age=31536000; SameSite=None; Secure`;
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      storageKey={THEME_KEY}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
