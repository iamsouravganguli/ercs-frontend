"use client";
import { useParams } from "next/navigation";
import { IndianRupee } from "lucide-react";
export default function ManageFeesWorkflow() {
  const { caseId } = useParams<{ caseId: string }>();
  return (
    <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">
        Fees & Payments
      </div>
      <div className="p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mb-3">
          <IndianRupee className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-foreground">No fees recorded</p>
        <p className="text-xs text-muted-foreground mt-1">
          Fees for {String(caseId)} will appear here.
        </p>
      </div>
    </section>
  );
}
