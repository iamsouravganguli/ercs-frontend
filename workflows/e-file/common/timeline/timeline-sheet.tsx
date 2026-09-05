"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import Timeline from "./timeline";
import { CustomSheet } from "./custom-sheet";

export function TimelineSheet({
  open,
  onOpenChange,
  trigger,
}: {
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  trigger?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled
    ? (onOpenChange ?? (() => {}))
    : setInternalOpen;

  return (
    <>
      {trigger && <div onClick={() => setIsOpen(true)}>{trigger}</div>}
      <CustomSheet open={isOpen} onOpenChange={setIsOpen}>
        <div className="sticky top-0 z-20 flex items-center h-14 px-6 border-b bg-card shrink-0">
          <h1 className="text-lg font-semibold tracking-tight">
            {t("case.timeline.title") ?? "Case Progress"}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Timeline embedded />
        </div>
        <div className="flex items-center justify-end border-t bg-card px-6 py-3 z-10 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="px-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Close
          </Button>
        </div>
      </CustomSheet>
    </>
  );
}

export default TimelineSheet;
