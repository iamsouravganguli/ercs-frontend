"use client";

import { useState } from "react";
import { ExternalLink, ArrowRight, AlertTriangle } from "lucide-react";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

export type AppLink = {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  category?: string;
  badge?: string;
};

type ImportantRevenueApplicationsWebsiteProps = {
  sectionTitle?: string;
  sectionSubtitle?: string;
  applications?: AppLink[];
  dialogTitle?: string;
  dialogDescription?: string;
  cancelText?: string;
  continueText?: string;
};

export function ImportantRevenueApplicationsWebsite({
  sectionTitle = "Revenue Applications",
  sectionSubtitle = "Official government revenue portals",
  applications = [],
  dialogTitle = "You are leaving this site",
  dialogDescription = "You are about to be redirected to an external government portal.",
  cancelText = "Cancel",
  continueText = "Continue",
}: ImportantRevenueApplicationsWebsiteProps) {
  const [open, setOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState("");

  const handleClick = (app: AppLink) => {
    if (app.url === "#") return;
    setSelectedUrl(app.url);
    setOpen(true);
  };

  const continueRedirect = () => {
    window.open(selectedUrl, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <section className="w-full py-12 bg-muted/50 border-t border-border/40 text-foreground relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight tracking-tight">
            {sectionTitle}
          </h2>
          {sectionSubtitle && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {sectionSubtitle}
            </p>
          )}
        </div>

        {}
        {applications.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {applications.map((app, i) => {
              const isLinkDisabled = app.url === "#";

              return (
                <button
                  key={i}
                  onClick={() => handleClick(app)}
                  disabled={isLinkDisabled}
                  className="group relative text-left flex flex-col justify-between gap-4 rounded-xl
                    border border-border bg-card p-4 cursor-pointer
                    transition-all duration-200 h-full w-full
                    hover:border-primary/40 hover:bg-muted/30
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="space-y-3 w-full">
                    {}
                    <div className="text-primary/80 dark:text-secondary-foreground/80 shrink-0 [&>svg]:w-4 [&>svg]:h-4">
                      {app.icon}
                    </div>

                    {}
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary dark:group-hover:text-secondary-foreground transition-colors duration-200">
                        {app.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {app.description}
                      </p>
                    </div>
                  </div>

                  {}
                  {!isLinkDisabled && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-secondary-foreground shrink-0">
                      <span>Launch Portal</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl border border-border bg-card p-0 shadow-xl overflow-hidden flex flex-col gap-0">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-3 px-6 pt-6 sm:px-8 sm:pt-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:text-secondary-foreground shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5 sm:px-8 flex flex-col items-stretch">
            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              {dialogDescription}
            </p>

            {}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-muted border border-border w-full">
              <ExternalLink className="w-3.5 h-3.5 text-primary dark:text-secondary-foreground shrink-0" />
              <span className="text-[11px] font-mono text-muted-foreground truncate flex-1 select-all">
                {selectedUrl}
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-center gap-3 bg-muted/50 border-t p-4 sm:p-5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-xs font-semibold border-border bg-transparent hover:bg-muted min-w-[100px] justify-center"
            >
              {cancelText}
            </Button>
            <Button
              size="sm"
              onClick={continueRedirect}
              className="gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 min-w-[100px] flex justify-center items-center"
            >
              {continueText}
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
