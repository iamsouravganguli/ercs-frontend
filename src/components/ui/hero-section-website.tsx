"use client";

import { LogIn, UserPlus, ArrowRight, LayoutDashboard } from "lucide-react";
import { useTranslation } from "@/i18n";

type StatItem = {
  label: string;
  value: number;
  valueColor: string;
  bg: string;
  border: string;
  divider: string;
  glow: string;
};

type HeroSectionWebsiteProps = {
  image?: string;
  loginHref?: string;
  registerHref?: string;
  dashboardHref?: string;
  loginText?: string;
  registerText?: string;
  dashboardText?: string;
  isAuthenticated?: boolean;
  stats?: StatItem[];
};

const formatIN = (num: any) => {
  const parsed = Number(num);
  if (isNaN(parsed) || parsed === 0) return "N/A";
  return new Intl.NumberFormat("en-IN").format(parsed);
};


function hardNav(href: string) {
  window.location.href = href;
}

export function HeroSectionWebsite({
  image = "/bor-court.png",
  loginHref = "/login",
  registerHref = "/register",
  dashboardHref = "/dashboard",
  loginText,
  registerText,
  dashboardText,
  isAuthenticated = false,
  stats = [],
}: HeroSectionWebsiteProps) {
  const { t } = useTranslation();
  return (
    <section
      className="relative w-full min-h-[580px] md:min-h-[640px] lg:min-h-[700px] overflow-hidden bg-black flex items-center bg-fixed bg-cover bg-[center_40%] bg-no-repeat"
      style={{ backgroundImage: `url(${image})` }}
    >
      {}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

      {}
      <div className="relative z-10 w-full pt-16 pb-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl flex flex-col justify-center">
            {}
            <h1
              className="font-heading text-white font-extrabold
              text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-tight"
            >
              <span className="block">{t("hero.title_line1")}</span>
              <span className="block text-zinc-200 mt-1">
                {t("hero.title_line2")}
              </span>
            </h1>

            {}
            <p className="font-sans text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl mt-6">
              {t("hero.subtitle")}
            </p>

            {}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => hardNav(dashboardHref)}
                  className="inline-flex items-center gap-2
                    px-3.5 py-1.5 rounded-md
                    bg-primary text-primary-foreground
                    font-semibold text-xs tracking-wide
                    transition-all duration-200
                    hover:bg-primary/95 hover:scale-[1.02]
                    active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {dashboardText ?? t("menu.dashboard")}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => hardNav(loginHref)}
                    className="inline-flex items-center gap-2
                      px-3.5 py-1.5 rounded-md
                      bg-primary text-primary-foreground
                      font-semibold text-xs tracking-wide
                      transition-all duration-200
                      hover:bg-primary/95 hover:scale-[1.02]
                      active:scale-[0.98] shadow-lg shadow-primary/20"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    {loginText ?? t("menu.login")}
                  </button>

                  <button
                    onClick={() => hardNav(registerHref)}
                    className="group inline-flex items-center gap-2
                      px-3.5 py-1.5 rounded-md
                      border border-zinc-700 bg-zinc-800
                      text-zinc-100
                      font-semibold text-xs tracking-wide
                      transition-all duration-200
                      hover:bg-zinc-700 hover:border-zinc-600 hover:scale-[1.02]
                      active:scale-[0.98]"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {registerText ?? t("menu.register")}
                    <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
