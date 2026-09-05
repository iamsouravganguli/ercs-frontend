"use client";

import Image from "next/image";
import Link from "next/link";

type LinkItem = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterWebsiteProps = {
  logo?: string;
  brandTitle?: string;
  brandSubtitle?: string;
  brandDescription?: string;
  brandGov?: string;

  nicLogo?: string;
  digitalIndiaLogo?: string;
  version?: string;
  year?: number;

  quickLinksHeading?: string;
  legalHeading?: string;
  contactHeading?: string;

  quickLinks?: LinkItem[];
  legalLinks?: LinkItem[];

  address?: string;
  phone?: string;
  phoneHref?: string;
  email?: string;
  emailHref?: string;

  developedBy?: string;
  hostedBy?: string;

  contentOwnedBy?: string;
  allRightsReserved?: string;
};

function isExternal(href: string, explicit?: boolean): boolean {
  if (explicit !== undefined) return explicit;
  return href.startsWith("http://") || href.startsWith("https://");
}

export function FooterWebsite({
  nicLogo = "/nic.png",
  digitalIndiaLogo = "/digital-india.png",
  version = "1.0.0",
  year = new Date().getFullYear(),

  quickLinksHeading = "Quick Links",
  legalHeading = "Legal",
  contactHeading = "Contact",

  quickLinks = [],
  legalLinks = [],

  address = "",
  phone = "+91 01335–2669415",
  phoneHref = "tel:+911334567890",
  email = "boardofrevenue-uk@gov.in",
  emailHref = "mailto:boardofrevenue-uk@gov.in",

  developedBy = "",
  hostedBy = "",

  contentOwnedBy = "",
  allRightsReserved = "All rights reserved.",
}: FooterWebsiteProps) {
  const renderLinks = (items: LinkItem[]) =>
    items.map((item) => {
      const ext = isExternal(item.href, item.external);
      return (
        <li key={item.href}>
          <Link
            href={item.href}
            target={ext ? "_blank" : undefined}
            rel={ext ? "noopener noreferrer" : undefined}
            className="text-xs text-muted-foreground hover:text-primary dark:hover:text-secondary-foreground transition-colors py-1 block w-fit"
          >
            {item.label}
          </Link>
        </li>
      );
    });

  return (
    <footer className="bg-zinc-50 dark:bg-zinc-900 border-t border-border/80">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {}
        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
          {}
          {quickLinks.length > 0 && (
            <div>
              <h3 className="font-bold text-xs capitalize tracking-wide text-foreground mb-3">
                {quickLinksHeading}
              </h3>
              <ul className="space-y-0.5">{renderLinks(quickLinks)}</ul>
            </div>
          )}

          {}
          {legalLinks.length > 0 && (
            <div>
              <h3 className="font-bold text-xs capitalize tracking-wide text-foreground mb-3">
                {legalHeading}
              </h3>
              <ul className="space-y-0.5">{renderLinks(legalLinks)}</ul>
            </div>
          )}

          {}
          <div>
            <h3 className="font-bold text-xs capitalize tracking-wide text-foreground mb-3">
              {contactHeading}
            </h3>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              {address && <p>{address}</p>}
              {phone && (
                <p>
                  Phone:{" "}
                  <a
                    href={phoneHref}
                    className="hover:text-primary dark:hover:text-secondary-foreground transition-colors"
                  >
                    {phone}
                  </a>
                </p>
              )}
              {email && (
                <p>
                  Email:{" "}
                  <a
                    href={emailHref}
                    className="hover:text-primary dark:hover:text-secondary-foreground transition-colors break-all"
                  >
                    {email}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="border-t border-border/50 py-5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-6">
            <Image
              src={nicLogo}
              alt="NIC"
              width={90}
              height={30}
              className="grayscale opacity-50 dark:invert dark:opacity-40 hover:opacity-85 transition-opacity"
            />
            <div className="h-4 w-px bg-border/40" />
            <Image
              src={digitalIndiaLogo}
              alt="Digital India"
              width={100}
              height={30}
              className="grayscale opacity-50 dark:invert dark:opacity-40 hover:opacity-85 transition-opacity"
            />
          </div>
          {(developedBy || hostedBy) && (
            <div className="text-center text-[11px] text-muted-foreground leading-relaxed">
              {developedBy && <p>{developedBy}</p>}
              {hostedBy && <p>{hostedBy}</p>}
            </div>
          )}
        </div>

        {}
        <div className="border-t border-border/50 py-4 flex flex-col items-center justify-center gap-2 text-[11px] text-muted-foreground text-center">
          <p className="text-center">
            © {year}{" "}
            {contentOwnedBy && (
              <span className="text-foreground/75 font-medium">
                {contentOwnedBy}
              </span>
            )}
            {contentOwnedBy && ". "}
            {allRightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
}
