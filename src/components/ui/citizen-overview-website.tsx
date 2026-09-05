"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type CitizenOverviewWebsiteProps = {
  sectionTitle?: string;
  sectionSubtitle?: string;
  features?: Feature[];
};

export function CitizenOverviewWebsite({
  sectionTitle = "Citizen Services",
  sectionSubtitle = "Access essential services for managing your cases online",
  features = [],
}: CitizenOverviewWebsiteProps) {
  return (
    <section className="w-full py-12 md:py-16 bg-background border-b border-border/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="max-w-3xl mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight tracking-tight">
            {sectionTitle}
          </h2>
          {sectionSubtitle && (
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xl">
              {sectionSubtitle}
            </p>
          )}
        </div>

        {}
        {features.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;

              return (
                <div
                  key={i}
                  className="flex flex-col items-start gap-3 p-5 rounded-xl border border-border bg-card h-full"
                >
                  {}
                  <div className="p-2 rounded-lg bg-primary/10 text-primary dark:text-secondary-foreground shrink-0 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                    <Icon />
                  </div>

                  {}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground leading-snug">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
