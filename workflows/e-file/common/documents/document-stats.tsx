"use client";
import { useTranslation } from "@/i18n";

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export type DocumentStatsProps = {
  files: any[];
  className?: string;
};

export function DocumentStats({ files, className }: DocumentStatsProps) {
  const { t } = useTranslation();
  const totalSize = files.reduce(
    (acc: number, f: any) => acc + (f.size ?? 0),
    0,
  );
  const typeCount = new Set(files.map((f: any) => f.type_of_doc)).size;
  return (
    <div className={className ?? "grid grid-cols-1 sm:grid-cols-3 gap-4"}>
      <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex items-center gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground capitalize tracking-normal">
            {t("case.documents.total_documents")}
          </p>
          <p className="text-2xl font-semibold mt-0.5 text-foreground">
            {files.length}
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex items-center gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground capitalize tracking-normal">
            {t("case.documents.total_size")}
          </p>
          <p className="text-2xl font-semibold mt-0.5 text-foreground">
            {files.length > 0 ? formatSize(totalSize) : "0 B"}
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex items-center gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground capitalize tracking-normal">
            {t("case.documents.document_types")}
          </p>
          <p className="text-2xl font-semibold mt-0.5 text-foreground">
            {typeCount}
          </p>
        </div>
      </div>
    </div>
  );
}
