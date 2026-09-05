"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Bell,
  Plus,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  KeyRound,
  Radio,
  X,
} from "lucide-react";
import { DSCBridgeSDK } from '@/lib/dsc-sdk';
import { useSessionCheck, apiClient, useNoticeDeliveryModeList, useStatusList, getFileUrl } from '@/lib/query';
import { CommonsApiServices } from '@/lib/services';
import toast from "react-hot-toast";
import { useTranslation } from "@/i18n";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type NoticeItem = {
  id: string;
  type_of_doc: string;
  file_name: string;
  file_url: string;
  remarks: string;
  is_signed: boolean;
  signed_at?: string;
  signed_by?: any;
  created_at: string;
  status_detail?: any;
  meta?: {
    title: string;
    message: string;
    delivery_mode: any;
    status: string;
    service_report?: {
      served_date: string;
      recipient_name: string;
      relationship: string;
      status: "Served" | "Not Served";
      remarks: string;
      service_mode: any;
    };
  };
};

export default function CaseNoticePage() {
  const { case_number } = useParams<{
    case_number: string;
  }>();

  const sessionCheck = useSessionCheck();
  const activeSessionRole =
    sessionCheck.data?.result?.data?.role?.toUpperCase() || "CO";

  const [items, setItems] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(false);


  const [activeReportItem, setActiveReportItem] = useState<NoticeItem | null>(
    null,
  );
  const [serviceStatus, setServiceStatus] = useState<"Served" | "Not Served">(
    "Served",
  );
  const [recipientName, setRecipientName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceRemarks, setServiceRemarks] = useState("");
  const [serviceMode, setServiceMode] = useState<string>("By Hand");

  async function saveServiceReport() {
    if (!activeReportItem) return;

    try {
      setLoading(true);
      const updatedMeta = {
        ...(activeReportItem.meta || {
          title: "",
          message: "",
          delivery_mode: "By Hand",
        }),
        status: serviceStatus === "Served" ? "Completed" : "Pending",
        service_report: {
          served_date: serviceDate,
          recipient_name: recipientName,
          relationship: relationship,
          status: serviceStatus,
          remarks: serviceRemarks,
          service_mode: serviceMode,
        },
      };

      await CommonsApiServices.DocumentUpdateService(activeReportItem.id, {
        meta: updatedMeta,
      });

      const targetStatusCode =
        serviceStatus === "Served" ? "NOTICE_SERVED" : "NOTICE_UNSERVED";
      const targetStatusId = noticeStatuses.find(
        (s: any) => s.code === targetStatusCode,
      )?.id;
      if (targetStatusId) {
        await CommonsApiServices.CaseDocumentUpdateStatusService(
          activeReportItem.id,
          targetStatusId,
        );
      }

      toast.success(t("case.notices.saved_success"));


      setActiveReportItem(null);
      await loadNotices();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save service report.");
    } finally {
      setLoading(false);
    }
  }

  const isCTorAD =
    activeSessionRole === "CT" ||
    activeSessionRole === "AD" ||
    activeSessionRole === "CT" ||
    activeSessionRole === "AD";
  const canCreate = !isCTorAD;
  const canComplete =
    activeSessionRole === "AD" ||
    activeSessionRole === "CT" ||
    activeSessionRole === "AD" ||
    activeSessionRole === "CT";

  const { t, lang } = useTranslation();

  const deliveryModesQuery = useNoticeDeliveryModeList();

  const { data: statusRes } = useStatusList({ "filters[type]": "NOTICE" });
  const noticeStatuses = statusRes?.result?.data || [];

  const getNoticeStatusVariant = (
    code: string,
  ): "success" | "error" | "warning" | "info" | "neutral" => {
    switch (code) {
      case "NOTICE_SERVED":
        return "success";
      case "NOTICE_UNSERVED":
        return "warning";
      case "NOTICE_EXPIRED":
      case "NOTICE_CANCELLED":
        return "error";
      case "NOTICE_ISSUED":
        return "info";
      case "NOTICE_DRAFTED":
      default:
        return "neutral";
    }
  };

  const getDeliveryModeLabel = (modes: any) => {
    if (!modes) return "N/A";
    const modeList = Array.isArray(modes) ? modes : [modes];
    const masters = deliveryModesQuery.data?.result?.data || [];

    const labels = modeList.map((m: string) => {
      const match = masters.find((x: any) => x.code === m);
      if (match) {
        return lang === "hi"
          ? match.name || match.name_en
          : match.name_en || match.name;
      }
      return m;
    });

    return labels.join(", ");
  };

  useEffect(() => {
    loadNotices();
  }, [case_number]);


  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data === "refetch-notices") {
        loadNotices();
      }
    };

    const handleFocus = () => {
      loadNotices();
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [case_number]);

  const openAddPopup = () => {
    if (!case_number) return;
    const width = 850;
    const height = 900;

    let left = 100;
    let top = 100;
    if (typeof window !== "undefined") {
      const sX = window.screenX;
      const oW = window.outerWidth;
      const sY = window.screenY;
      const oH = window.outerHeight;
      if (
        typeof sX === "number" &&
        typeof oW === "number" &&
        !isNaN(sX) &&
        !isNaN(oW)
      ) {
        left = Math.max(0, sX + (oW - width) / 2);
      }
      if (
        typeof sY === "number" &&
        typeof oH === "number" &&
        !isNaN(sY) &&
        !isNaN(oH)
      ) {
        top = Math.max(0, sY + (oH - height) / 2);
      }
    }

    window.open(
      `/case/${case_number}/notices/add`,
      "NoticeFormPopup",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
  };

  async function loadNotices() {
    try {
      setLoading(true);
      const res = await CommonsApiServices.CaseDocumentListService(case_number);
      const allDocs = res.result?.data || [];

      const noticeDocs = allDocs.filter(
        (doc: any) =>
          (doc.type_of_doc === "CASE_NOTICE" ||
            doc.type_of_doc === "CASE_SUMMON") &&
          doc.is_active !== false,
      );
      setItems(noticeDocs);
    } catch (err) {
      console.error("Failed to load notices from database:", err);
    } finally {
      setLoading(false);
    }
  }

  async function completeNotice(item: NoticeItem) {
    if (!canComplete) return;

    try {
      const updatedMeta = {
        ...(item.meta || { title: "", message: "", delivery_mode: "By Hand" }),
        status: "Completed",
      };

      await CommonsApiServices.DocumentUpdateService(item.id, {
        meta: updatedMeta,
      });

      toast.success(t("case.notices.completed_notice"));
      await loadNotices();
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete notice.");
    }
  }

  async function deleteNotice(id: string | number) {
    if (!confirm(t("case.notices.delete_notice_confirm"))) return;
    try {
      await CommonsApiServices.CaseDocumentDeleteService(id);
      toast.success(t("case.notices.deleted_success"));
      await loadNotices();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete notice.");
    }
  }

  async function verifySignature(id: string | number) {
    try {
      const res = await CommonsApiServices.DocumentVerifyService(id);
      const data = res?.result?.data;
      if (data?.is_hash_valid) {
        toast.success(t("case.notices.signature_verified"));
      } else {
        toast.error(t("case.notices.signature_failed"));
      }
    } catch (err) {
      toast.error(t("case.notices.signature_failed"));
    }
  }

  const pending = items.filter((x) => x.meta?.status === "Pending").length;
  const completed = items.filter((x) => x.meta?.status === "Completed").length;

  return (
    <div className="flex flex-col h-full bg-background dark:bg-neutral-950 overflow-hidden relative border-r">
      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {}
        {!isCTorAD && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                  {t("case.notices.total_notices")}
                </p>
                <p className="text-2xl font-bold mt-0.5 text-foreground">
                  {items.length}
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                  {t("case.notices.pending_notices")}
                </p>
                <p className="text-2xl font-bold mt-0.5 text-foreground">
                  {pending}
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                  {t("case.notices.completed_notices")}
                </p>
                <p className="text-2xl font-bold mt-0.5 text-foreground">
                  {completed}
                </p>
              </div>
            </div>
          </div>
        )}

        {}
        <Card className="py-0! gap-0! overflow-hidden">
          <CardHeader className="px-6 py-3 border-b bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-left">
                <CardTitle className="text-sm font-semibold">
                  {isCTorAD
                    ? t("case.notices.title_citizen")
                    : t("case.notices.issued_notices")}
                </CardTitle>
              </div>
              {canCreate && !isCTorAD && (
                <Button
                  onClick={openAddPopup}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("case.notices.draft_document")}
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground italic">
                {t("case.notices.loading")}
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center space-y-4 m-6 border border-dashed rounded-2xl bg-muted/5">
                <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground/50">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("case.notices.no_notices")}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-border text-left">
                <tbody className="divide-y divide-border bg-card">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground">
                            {item.meta?.title || item.file_name}
                          </p>

                          {}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                item.type_of_doc === "CASE_SUMMON"
                                  ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                                  : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                              }`}
                            >
                              {item.type_of_doc === "CASE_SUMMON"
                                ? t("case.notices.summon")
                                : t("case.notices.notice")}
                            </span>
                            {item.is_signed && (
                              <div className="flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                {t("case.notices.digitally_signed")}
                              </div>
                            )}
                          </div>

                          {}
                          {item.meta?.service_report && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/60 text-[10px] text-foreground/80 space-y-1 max-w-sm">
                              <p className="font-bold text-foreground/90 flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${item.meta.service_report.status === "Served" ? "bg-emerald-500" : "bg-rose-500"}`}
                                />
                                {t("case.notices.report_service")}:{" "}
                                <span
                                  className={
                                    item.meta.service_report.status === "Served"
                                      ? "text-emerald-600"
                                      : "text-rose-600"
                                  }
                                >
                                  {item.meta.service_report.status === "Served"
                                    ? t("case.notices.served")
                                    : t("case.notices.not_served")}
                                </span>
                              </p>
                              {item.meta.service_report.status === "Served" && (
                                <p>
                                  {t("case.notices.recipient_name")}:{" "}
                                  <span className="font-semibold text-foreground/90">
                                    {item.meta.service_report.recipient_name}
                                  </span>{" "}
                                  ({item.meta.service_report.relationship})
                                </p>
                              )}
                              <p>
                                {t("case.notices.delivery_mode")}:{" "}
                                <span className="font-semibold text-foreground/90">
                                  {getDeliveryModeLabel(
                                    item.meta.service_report.service_mode ||
                                      item.meta.delivery_mode,
                                  )}
                                </span>
                                {item.meta.service_report.served_date &&
                                  ` - ${item.meta.service_report.served_date}`}
                              </p>
                              {item.meta.service_report.remarks && (
                                <p className="italic text-muted-foreground border-l-2 pl-2 mt-1">
                                  &ldquo;{item.meta.service_report.remarks}&rdquo;
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-foreground/80">
                        {getDeliveryModeLabel(item.meta?.delivery_mode)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.status_detail ? (
                          <StatusBadge
                            variant={getNoticeStatusVariant(
                              item.status_detail.code,
                            )}
                          >
                            {lang === "hi"
                              ? item.status_detail.name ||
                                item.status_detail.name_en
                              : item.status_detail.name_en ||
                                item.status_detail.name}
                          </StatusBadge>
                        ) : (
                          <StatusBadge variant="neutral">
                            {t("case.notices.pending")}
                          </StatusBadge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {item.is_signed && (
                            <Button
                              size="sm"
                              variant="outline"
                              title="Verify DSC Signature Integrity"
                              className="h-8 rounded-lg px-2 flex items-center gap-1 text-emerald-600 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                              onClick={() => verifySignature(item.id)}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {t("case.notices.verify")}
                            </Button>
                          )}

                          <a
                            href={getFileUrl(item.file_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground shrink-0 shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            {t("case.notices.download")}
                          </a>

                          {canCreate && !isCTorAD && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg px-3 flex items-center gap-1 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary shadow-xs"
                              onClick={() => {
                                setActiveReportItem(item);
                                setServiceStatus(
                                  item.meta?.service_report?.status || "Served",
                                );
                                setRecipientName(
                                  item.meta?.service_report?.recipient_name ||
                                    "",
                                );
                                setRelationship(
                                  item.meta?.service_report?.relationship || "",
                                );
                                setServiceDate(
                                  item.meta?.service_report?.served_date ||
                                    new Date().toISOString().split("T")[0],
                                );
                                setServiceRemarks(
                                  item.meta?.service_report?.remarks || "",
                                );
                                setServiceMode(
                                  item.meta?.service_report?.service_mode ||
                                    item.meta?.delivery_mode ||
                                    "By Hand",
                                );
                              }}
                            >
                              {item.meta?.service_report
                                ? t("case.notices.update_report")
                                : t("case.notices.report_service")}
                            </Button>
                          )}

                          {canCreate && !isCTorAD && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive p-2 rounded-lg"
                              onClick={() => deleteNotice(item.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {}
      {activeReportItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-background border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="px-6 py-4 border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground">
                  {t("case.notices.service_report_title")}
                </CardTitle>
                <button
                  onClick={() => setActiveReportItem(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  {t("case.notices.document")}
                </label>
                <p className="text-xs font-bold text-foreground bg-muted/50 p-2.5 rounded-xl border">
                  {activeReportItem.meta?.title || activeReportItem.file_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {t("case.notices.service_status")} *
                  </label>
                  <select
                    value={serviceStatus}
                    onChange={(e) =>
                      setServiceStatus(
                        e.target.value as "Served" | "Not Served",
                      )
                    }
                    className="w-full h-10 rounded-xl border px-3 text-xs bg-background focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Served">{t("case.notices.served")}</option>
                    <option value="Not Served">
                      {t("case.notices.not_served")}
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {t("case.notices.delivery_mode")}
                  </label>
                  <select
                    value={serviceMode}
                    onChange={(e) => setServiceMode(e.target.value)}
                    className="w-full h-10 rounded-xl border px-3 text-xs bg-background focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="By Hand">{t("case.notices.by_hand")}</option>
                    <option value="Post">{t("case.notices.post")}</option>
                    <option value="Email">{t("case.notices.email")}</option>
                    <option value="WhatsApp">
                      {t("case.notices.whatsapp")}
                    </option>
                    <option value="Court Notice Board">
                      {t("case.notices.court_notice_board")}
                    </option>
                  </select>
                </div>
              </div>

              {serviceStatus === "Served" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      {t("case.notices.recipient_name")} *
                    </label>
                    <input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={t("case.notices.enter_name")}
                      className="w-full h-10 rounded-xl border px-3 text-xs bg-background focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      {t("case.notices.relationship")} *
                    </label>
                    <input
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      placeholder={t("case.notices.enter_relationship")}
                      className="w-full h-10 rounded-xl border px-3 text-xs bg-background focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  {t("case.notices.service_date")} *
                </label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full h-10 rounded-xl border px-3 text-xs bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  {t("case.notices.remarks_report")}
                </label>
                <textarea
                  rows={3}
                  value={serviceRemarks}
                  onChange={(e) => setServiceRemarks(e.target.value)}
                  placeholder={t("case.notices.enter_report_details")}
                  className="w-full rounded-xl border px-3 py-2 text-xs bg-background resize-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-dashed">
                <Button
                  variant="outline"
                  onClick={() => setActiveReportItem(null)}
                  className="rounded-xl"
                >
                  {t("case.notices.cancel")}
                </Button>
                <Button
                  onClick={saveServiceReport}
                  disabled={loading}
                  className="rounded-xl px-5"
                >
                  {t("case.notices.save_report")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
