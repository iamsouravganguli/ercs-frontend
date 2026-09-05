"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PageTab {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  isActive?: (pathname: string) => boolean;
  disabled?: boolean;
}

export interface PageTabsProps {
  tabs: PageTab[];
  className?: string;
}

export function PageTabs({ tabs, className }: PageTabsProps) {
  const pathname = usePathname();

  return (
    <div className={cn("md:py-3.5 pb-2.5", className)}>
      <nav
        className={cn(
          "inline-flex items-center rounded-lg bg-neutral-200/50 dark:bg-neutral-900/60 p-[3px] border border-neutral-300/30 dark:border-neutral-800/40 shadow-sm",
          "overflow-x-auto max-w-full",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[-webkit-overflow-scrolling:touch]",
        )}
      >
        {tabs.map(
          ({ key, label, href, icon: Icon, isActive, disabled }, index) => {
            const active = isActive
              ? isActive(pathname)
              : pathname === href ||
                (pathname.startsWith(`${href}/`) &&
                  !tabs.some(
                    (t) =>
                      t.href !== href &&
                      t.href.startsWith(`${href}/`) &&
                      (pathname === t.href ||
                        pathname.startsWith(`${t.href}/`)),
                  ));

            const nextActive = (() => {
              const nextTab = tabs[index + 1];
              if (!nextTab) return false;
              return nextTab.isActive
                ? nextTab.isActive(pathname)
                : pathname === nextTab.href ||
                    (pathname.startsWith(`${nextTab.href}/`) &&
                      !tabs.some(
                        (t) =>
                          t.href !== nextTab.href &&
                          t.href.startsWith(`${nextTab.href}/`) &&
                          (pathname === t.href ||
                            pathname.startsWith(`${t.href}/`)),
                      ));
            })();

            if (disabled) {
              return (
                <span
                  key={key}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-[5px]",
                    "text-xs font-medium whitespace-nowrap",
                    "cursor-not-allowed select-none",
                    "text-neutral-400/40 dark:text-neutral-500/40",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-30" />
                  <span>{label}</span>
                </span>
              );
            }

            return (
              <Link
                key={key}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-1.5 rounded-[6px]",
                  "text-xs font-medium whitespace-nowrap transition-all duration-200 ease-out",
                  "outline-none focus-visible:ring-1.5 focus-visible:ring-primary/30",
                  active
                    ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.02)] dark:bg-neutral-800 dark:text-white dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)] border-[0.5px] border-black/5 dark:border-white/5 font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-neutral-800/40",
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-colors",
                    active
                      ? "text-neutral-900 dark:text-white"
                      : "text-neutral-400 dark:text-neutral-500",
                  )}
                />
                <span>{label}</span>

                {}
                {!active && !nextActive && index < tabs.length - 1 && (
                  <span className="absolute right-0 top-1.5 bottom-1.5 w-[1px] bg-neutral-300/60 dark:bg-neutral-800/80" />
                )}
              </Link>
            );
          },
        )}
      </nav>
    </div>
  );
}
