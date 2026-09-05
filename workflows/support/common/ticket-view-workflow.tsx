"use client";

import { useTranslation } from "@/i18n";
import { getLabel } from "@/lib";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock, User, FileText } from "lucide-react";

type TicketViewWorkflowProps = {
  ticket: any;
  onOpenChat?: (ticketNumber: string) => void;
  lang?: string;
};

export function TicketViewWorkflow({
  ticket,
  onOpenChat,
  lang,
}: TicketViewWorkflowProps) {
  const { t } = useTranslation();
  const l = (lang as any) || "en";

  if (!ticket) return null;

  const statusDetail = ticket.status_detail;
  const priorityDetail = ticket.priority_detail;
  const categoryDetail = ticket.category_detail;

  const statusCode = String(
    statusDetail?.code || ticket.status || "",
  ).toUpperCase();
  let variant: "success" | "error" | "warning" | "info" | "neutral" = "neutral";
  if (statusCode === "RESOLVED") variant = "success";
  else if (statusCode === "IN_PROGRESS") variant = "info";
  else if (statusCode === "CLOSED") variant = "neutral";
  else variant = "warning";

  return (
    <div className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          {ticket.ticket_number}
        </h3>
        <StatusBadge variant={variant}>
          {statusDetail ? getLabel(statusDetail, l) : ticket.status}
        </StatusBadge>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground capitalize">
            {t("support.table.subject") || "Subject"}
          </p>
          <p className="text-sm font-semibold text-foreground mt-1 line-clamp-2">
            {ticket.subject || "-"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground capitalize">
              {t("support.table.category") || "Category"}
            </p>
            <p className="text-sm text-foreground mt-1">
              {categoryDetail ? getLabel(categoryDetail, l) : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground capitalize">
              {t("support.table.priority") || "Priority"}
            </p>
            <p className="text-sm mt-1">
              {priorityDetail ? (
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${String(priorityDetail.code).toUpperCase() === "HIGH" ? "bg-red-100 text-red-700" : String(priorityDetail.code).toUpperCase() === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {getLabel(priorityDetail, l)}
                </span>
              ) : (
                "-"
              )}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3 h-3" />{" "}
            {new Date(ticket.created_at).toLocaleString(
              l === "hi" ? "hi-IN" : "en-IN",
              { dateStyle: "medium", timeStyle: "short" },
            )}
          </div>
          {ticket.created_by_detail && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3 h-3" />{" "}
              {ticket.created_by_detail?.name ||
                ticket.created_by_detail?.username ||
                "-"}
            </div>
          )}
        </div>
        {onOpenChat && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onOpenChat(ticket.ticket_number)}
            className="w-full gap-1.5 h-8"
          >
            <Eye className="w-4 h-4" />{" "}
            {t("support.button.view_chat") || "View Conversation"}
          </Button>
        )}
      </div>
    </div>
  );
}
