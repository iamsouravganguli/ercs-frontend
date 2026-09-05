"use client";

import { usePathname } from "next/navigation";

export function Footer({
  org = "Board of Revenue, Uttarakhand",
  copyright,
  version = "1.0.0",
  contentOwnedBy,
  brandGov = "Government of Uttarakhand",
  hideOnPaths = [],
  centered = false,
}: {
  org?: string;
  copyright?: string;
  version?: string;
  contentOwnedBy?: string;
  brandGov?: string;
  hideOnPaths?: string[];
  centered?: boolean;
}) {
  const pathname = usePathname();
  const year = new Date().getFullYear();


  const shouldHide = hideOnPaths.some((path) => pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <footer className="border-t border-border bg-background w-full shrink-0">
      <div className="w-full px-4 md:px-6">
        <div
          className={
            centered
              ? "flex flex-col sm:flex-row items-center justify-center h-auto py-3 gap-2 text-center text-[10px] text-muted-foreground"
              : "flex items-center justify-between h-8 gap-4 text-[10px] text-muted-foreground"
          }
        >
          {centered ? (
            <>
              <p className="leading-normal">
                <span>{copyright ?? `© ${year} ${brandGov}`}</span>
              </p>
            </>
          ) : (
            <>
              <p className="leading-none truncate">
                <span>{copyright ?? `© ${year} ${brandGov}`}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
