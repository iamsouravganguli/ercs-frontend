"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Calendar,
  Clock,
  Video,
  Trash2,
  Pencil,
  Eye,
  Building2,
  ExternalLink,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import toast from "react-hot-toast";

import {
  useCaseHearingList,
  useCaseHearingDelete,
  useUserRole,
} from "@/lib";
import { useTranslation } from "@/i18n";

export default function CaseHearingsPage() {
  const params = useParams();
  const case_number = params?.case_number as string;
  const { t, lang } = useTranslation();
  const { isCitizenOrAdvocate } = useUserRole();


  const {
    data: hearingsRes,
    refetch: refetchHearings,
    isLoading,
  } = useCaseHearingList(case_number);

  const hearingList = hearingsRes?.result?.data || [];

  const deleteHearingMutation = useCaseHearingDelete();


  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data === "refetch-hearings") {
        refetchHearings();
      }
    };
    const handleFocus = () => refetchHearings();
    window.addEventListener("message", handleMessage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refetchHearings]);


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
      `/case/${encodeURIComponent(case_number)}/hearing/add`,
      `AddHearing_${case_number}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`,
    );
  };

  const openEditPopup = (item: any) => {
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
      `/case/${encodeURIComponent(case_number)}/hearing/edit?id=${encodeURIComponent(item.id)}`,
      `EditHearing_${item.id}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`,
    );
  };

  const openViewDetail = (item: any) => {
    if (!case_number) return;
    const width = 850;
    const height = 800;
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
      `/case/${encodeURIComponent(case_number)}/hearing/view?id=${encodeURIComponent(item.id)}`,
      `HearingDetail_${item.id}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`,
    );
  };


  const handleDeleteHearing = async (id: number | string) => {
    if (
      !confirm(
        lang === "hi"
          ? "क्या आप निश्चित रूप से इस सुनवाई रिकॉर्ड को हटाना चाहते हैं?"
          : "Are you sure you want to delete this hearing record?",
      )
    ) {
      return;
    }

    try {
      toast.loading(lang === "hi" ? "हटाया जा रहा है..." : "Deleting...", {
        id: "delete-h",
      });
      await deleteHearingMutation.mutateAsync({
        caseNumber: case_number,
        pk: id,
      });
      toast.dismiss("delete-h");
      toast.success(
        lang === "hi"
          ? "सुनवाई सफलतापूर्वक हटाई गई।"
          : "Hearing deleted successfully.",
      );
      refetchHearings();
    } catch (err: any) {
      toast.dismiss("delete-h");
      toast.error(err?.message || "Failed to delete hearing.");
    }
  };


  const totalCount = hearingList.length;
  const scheduledCount = hearingList.filter(
    (h: any) => h.status === "SCHEDULED",
  ).length;
  const completedCount = hearingList.filter(
    (h: any) => h.status === "COMPLETED",
  ).length;
  const adjournedCount = hearingList.filter(
    (h: any) => h.status === "ADJOURNED",
  ).length;

  const filteredHearings = hearingList.filter((item: any) => {
    if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const dateStr = String(item.hearing_date || "").toLowerCase();
      const typeStr = String(
        item.hearing_type_detail?.name_en ||
          item.hearing_type_detail?.name ||
          "",
      ).toLowerCase();
      const statusStr = String(
        item.hearing_status_detail?.name_en ||
          item.hearing_status_detail?.name ||
          "",
      ).toLowerCase();
      const outcomeStr = String(
        item.hearing_outcome_detail?.name_en ||
          item.hearing_outcome_detail?.name ||
          "",
      ).toLowerCase();
      return (
        dateStr.includes(query) ||
        typeStr.includes(query) ||
        statusStr.includes(query) ||
        outcomeStr.includes(query)
      );
    }
    return true;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "SCHEDULED":
        return "info";
      case "ADJOURNED":
        return "warning";
      case "CANCELLED":
        return "error";
      default:
        return "neutral";
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative border-r">
      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {lang === "hi" ? "कुल सुनवाई" : "Total Hearings"}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {totalCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {lang === "hi" ? "निर्धारित" : "Scheduled"}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {scheduledCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {lang === "hi" ? "संपन्न" : "Completed"}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {completedCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {lang === "hi" ? "स्थगित" : "Adjourned"}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {adjournedCount}
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
          {}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {["ALL", "SCHEDULED", "COMPLETED", "ADJOURNED", "CANCELLED"].map(
              (st) => (
                <Button
                  key={st}
                  variant={filterStatus === st ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterStatus(st)}
                  className="text-xs h-8 px-3 font-medium"
                >
                  {st === "ALL"
                    ? lang === "hi"
                      ? "सभी"
                      : "All"
                    : st === "SCHEDULED"
                      ? lang === "hi"
                        ? "निर्धारित"
                        : "Scheduled"
                      : st === "COMPLETED"
                        ? lang === "hi"
                          ? "संपन्न"
                          : "Completed"
                        : st === "ADJOURNED"
                          ? lang === "hi"
                            ? "स्थगित"
                            : "Adjourned"
                          : lang === "hi"
                            ? "निरस्त"
                            : "Cancelled"}
                </Button>
              ),
            )}
          </div>

          <div className="flex items-center gap-2">
            {}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={lang === "hi" ? "खोजें..." : "Search hearings..."}
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            {}
            {!isCitizenOrAdvocate && (
              <Button
                size="sm"
                onClick={openAddPopup}
                className="h-8 text-xs font-semibold shrink-0 gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {lang === "hi" ? "सुनवाई निर्धारित करें" : "Schedule Hearing"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {}
        <Card className="py-0! gap-0! overflow-hidden">
          <CardHeader className="px-6 py-3 border-b bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                {lang === "hi"
                  ? "सुनवाई विवरण एवं इतिहास"
                  : "Hearing Details & History"}
              </CardTitle>
              <Badge variant="outline" className="text-[11px]">
                {filteredHearings.length}{" "}
                {lang === "hi" ? "प्रविष्टियां" : "records"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left">
              <tbody className="divide-y divide-border bg-card">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-xs text-muted-foreground"
                    >
                      {lang === "hi"
                        ? "लोड हो रहा है..."
                        : "Loading hearing records..."}
                    </td>
                  </tr>
                ) : filteredHearings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-xs text-muted-foreground"
                    >
                      {lang === "hi"
                        ? "कोई सुनवाई विवरण उपलब्ध नहीं है।"
                        : "No hearing records found."}
                    </td>
                  </tr>
                ) : (
                  filteredHearings.map((item: any) => {
                    const statusDetail = item.hearing_status_detail;
                    const statusName = statusDetail
                      ? lang === "hi"
                        ? statusDetail.name
                        : statusDetail.name_en
                      : item.status;

                    const typeName = item.hearing_type_detail
                      ? lang === "hi"
                        ? item.hearing_type_detail.name
                        : item.hearing_type_detail.name_en
                      : "-";

                    const outcomeName = item.hearing_outcome_detail
                      ? lang === "hi"
                        ? item.hearing_outcome_detail.name
                        : item.hearing_outcome_detail.name_en
                      : "-";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/5 transition-colors"
                      >
                        {}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-foreground font-mono">
                                {item.hearing_date}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {item.hearing_time
                                  ? String(item.hearing_time).substring(0, 5)
                                  : "10:30"}{" "}
                                AM
                              </p>
                            </div>
                          </div>
                        </td>

                        {}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-foreground/90 bg-muted/60 border border-border px-2 py-0.5 rounded-md">
                            {typeName}
                          </span>
                        </td>

                        {}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge variant={getStatusVariant(item.status)}>
                            {statusName}
                          </StatusBadge>
                        </td>

                        {}
                        <td className="px-6 py-4 max-w-xs">
                          {outcomeName !== "-" ? (
                            <span className="text-xs font-semibold text-foreground/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              {outcomeName}
                            </span>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              {lang === "hi"
                                ? "सुनवाई लंबित है"
                                : "Hearing scheduled / pending"}
                            </p>
                          )}
                          {item.remarks && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                              Note: {item.remarks}
                            </p>
                          )}
                        </td>

                        {}
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {item.video_conference ? (
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="secondary"
                                className="bg-purple-500/10 text-purple-700 dark:text-purple-400 gap-1 text-[10px]"
                              >
                                <Video className="w-3.5 h-3.5" />
                                VC Online
                              </Badge>
                              {item.video_conference_link && (
                                <a
                                  href={item.video_conference_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-[11px] inline-flex items-center gap-0.5 font-medium"
                                >
                                  Join <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground/70" />
                              Physical Court
                            </span>
                          )}
                        </td>

                        {}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-1.5">
                            {}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                              onClick={() => openViewDetail(item)}
                              title={
                                lang === "hi" ? "विवरण देखें" : "View Details"
                              }
                            >
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>

                            {}
                            {!isCitizenOrAdvocate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted"
                                onClick={() => openEditPopup(item)}
                                title={
                                  lang === "hi"
                                    ? "संपादित करें"
                                    : "Edit Hearing"
                                }
                              >
                                <Pencil className="w-4 h-4 text-blue-600" />
                              </Button>
                            )}

                            {}
                            {!isCitizenOrAdvocate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDeleteHearing(item.id)}
                                title={
                                  lang === "hi" ? "हटाएं" : "Delete Hearing"
                                }
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
