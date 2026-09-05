"use client";

import { useParams } from "next/navigation";
import { useCaseTimeline } from "@/lib";
import { useTranslation } from "@/i18n";
import { format } from "date-fns";

export function Timeline({ embedded }: { embedded?: boolean }) {
  const { caseId } = useParams<{ caseId: string }>();
  const caseNumber = caseId as string;
  const { t } = useTranslation();
  const timelineQuery = useCaseTimeline(caseNumber);
  const rawEvents: any[] = timelineQuery.data?.result?.data || [];

  const isLoading = timelineQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-64 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700" />
      </div>
    );
  }

  const content = (
    <>
      {rawEvents.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-dashed rounded-xl bg-zinc-50 dark:bg-zinc-800/30">
          <p className="text-sm font-medium text-muted-foreground capitalize">
            {t("case.timeline.title") ?? "No case progress events yet"}
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-700 -translate-x-1/2" />
          <div className="space-y-6">
            {[...rawEvents]
              .sort(
                (a: any, b: any) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
              .map((event: any, idx: number) => {
                const date = event.date ? new Date(event.date) : null;
                return (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-4 top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-white dark:ring-zinc-900 -translate-x-1/2" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs font-semibold text-primary capitalize">
                        {event.type
                          ? event.type.toLowerCase().replace(/_/g, " ")
                          : "event"}
                      </span>
                      {date && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {format(date, "dd MMM yyyy, hh:mm a")}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mt-1 capitalize">
                      {event.title ? event.title.toLowerCase() : "—"}
                    </h4>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed capitalize">
                        {event.description.toLowerCase()}
                      </p>
                    )}
                    {event.meta?.created_by && (
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        By: {String(event.meta.created_by).toLowerCase()}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="space-y-4">
      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">
          {t("case.timeline.title") ?? "Case Progress"}
        </div>
        <div className="p-6">{content}</div>
      </section>
    </div>
  );
}

export default Timeline;
