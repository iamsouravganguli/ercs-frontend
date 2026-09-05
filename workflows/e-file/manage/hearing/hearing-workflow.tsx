"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Gavel, Plus, Pencil, Trash2, Eye, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomModal, CustomModalBody } from "@/components/ui/custom-modal";
import { DataTable, ColumnDef } from "@/components/ui/data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/i18n";
import {
  useProfileDetail,
  useCaseHearingList,
  useCaseHearingDelete,
  useHearingTypeList,
  useHearingStatusList,
  CommonsApiServices,
  canModifyManageTab,
  isCitizenAdvocate as isCitizenAdvocateRole,
} from "@/lib";
import { HearingForm } from "@/workflows/e-file/common/hearings/hearing-form";
import toast from "react-hot-toast";

type HearingRow = any;

function hearingStatusVariant(code?: string): "success" | "warning" | "error" | "info" | "neutral" {
  const c = String(code || "").toUpperCase();
  if (c === "COMPLETED" || c === "SCHEDULED") return "success";
  if (c === "ADJOURNED") return "warning";
  if (c === "CANCELLED") return "error";
  return "neutral";
}

export default function ManageHearingWorkflow() {
  const { caseId } = useParams<{ caseId: string }>();
  const case_number = caseId as string;
  const { t, lang } = useTranslation() as any;

  const { data: profileData } = useProfileDetail();
  const role = (profileData as any)?.role || (profileData as any)?.user?.role || (profileData as any)?.data?.role || "";
  const roleUpper = String(role || "").toUpperCase();
  const isCitizenAdvocate = isCitizenAdvocateRole(role);
  const canAdd = canModifyManageTab(role);

  const { data: hearingRes, isLoading, isError, refetch } = useCaseHearingList(case_number);
  const hearingList: HearingRow[] = (hearingRes as any)?.result?.data || (hearingRes as any)?.data || [];

  const { data: typesRes } = useHearingTypeList();
  const { data: hStatusRes } = useHearingStatusList();
  const types: any[] = (typesRes as any)?.result?.data || [];
  const hStatuses: any[] = (hStatusRes as any)?.result?.data || [];
  void t;

  const getTypeName = (row: any) => {
    const id = row.hearing_type;
    if (!id) return "—";
    const m = types.find((x: any) => String(x.id) === String(id));
    if (m) return lang === "hi" ? m.name || m.name_en : m.name_en || m.name;
    return row.hearing_type_detail ? (lang === "hi" ? row.hearing_type_detail.name || row.hearing_type_detail.name_en : row.hearing_type_detail.name_en || row.hearing_type_detail.name) : "—";
  };

  const getHStatusName = (row: any) => {
    const id = row.hearing_status;
    if (!id) return null;
    const m = hStatuses.find((x: any) => String(x.id) === String(id));
    if (m) return lang === "hi" ? m.name || m.name_en : m.name_en || m.name;
    return row.hearing_status_detail ? (lang === "hi" ? row.hearing_status_detail.name || row.hearing_status_detail.name_en : row.hearing_status_detail.name_en || row.hearing_status_detail.name) : null;
  };

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HearingRow | null>(null);

  const openAdd = () => { setEditing(null); setOpen(true); };
  const openEdit = (row: HearingRow) => { setEditing(row); setOpen(true); };

  const deleteMut = useCaseHearingDelete();
  const handleDelete = async (row: HearingRow) => {
    if (!confirm(lang === "hi" ? "क्या आप इस सुनवाई को हटाना चाहते हैं?" : "Delete this hearing?")) return;
    try {
      await deleteMut.mutateAsync({ caseNumber: case_number, pk: row.id });
      toast.success(lang === "hi" ? "सुनवाई हटाई गई।" : "Hearing deleted.");
      refetch();
    } catch (e: any) { toast.error(e?.message || "Failed to delete"); }
  };

  const handleVcLink = async (row: HearingRow) => {
    if (row.video_conference_link) {
      window.open(row.video_conference_link, "_blank");
      return;
    }
    try {
      const res: any = await CommonsApiServices.GenerateVideoMeeting();
      const link = res?.result?.data?.meeting_link || res?.meeting_link;
      if (link) window.open(link, "_blank");
      else toast.error("No meeting link");
    } catch (e: any) { toast.error(e?.message || "Failed to create meeting link"); }
  };

  const columns = useMemo<ColumnDef<HearingRow>[]>(
    () => [
      {
        accessorKey: "hearing_date",
        header: lang === "hi" ? "तिथि" : "Date",
        cell: ({ row }) => {
          const d = row.original.hearing_date;
          if (!d) return <span className="text-xs text-muted-foreground">—</span>;
          try {
            return <span className="text-xs font-medium text-foreground">{new Date(d).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>;
          } catch { return <span className="text-xs text-muted-foreground">{String(d)}</span>; }
        },
      },
      {
        accessorKey: "hearing_expected_start_time",
        header: lang === "hi" ? "समय" : "Time",
        cell: ({ row }) => {
          const s = row.original.hearing_expected_start_time || row.original.hearing_time;
          const e = row.original.hearing_expected_end_time;
          if (!s) return <span className="text-xs text-muted-foreground">—</span>;
          const fmt = (t: string) => String(t).slice(0, 5);
          return <span className="text-xs font-medium text-foreground">{fmt(s)}{e ? ` – ${fmt(e)}` : ""}</span>;
        },
      },
      {
        accessorKey: "hearing_type",
        header: lang === "hi" ? "प्रकार" : "Type",
        cell: ({ row }) => <span className="text-xs font-medium text-foreground line-clamp-1 max-w-[140px]">{getTypeName(row.original)}</span>,
      },
      {
        accessorKey: "status",
        header: lang === "hi" ? "स्थिति" : "Status",
        cell: ({ row }) => {
          const code = row.original.status;
          const label = getHStatusName(row.original) || code || "—";
          return <StatusBadge variant={hearingStatusVariant(code)}>{label}</StatusBadge>;
        },
      },
      {
        accessorKey: "remarks",
        header: lang === "hi" ? "टिप्पणी" : "Remarks",
        cell: ({ row }) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]" title={row.original.remarks || ""}>{row.original.remarks ? String(row.original.remarks).slice(0, 80) : "—"}</span>,
      },
      {
        id: "actions",
        header: lang === "hi" ? "कार्रवाई" : "Actions",
        cell: ({ row }) => {
          const r = row.original;
          const hasVc = !!r.video_conference || !!r.video_conference_link;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => openEdit(r)} title={lang === "hi" ? "संपादित करें" : "Edit"}>
                <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </Button>
              {canAdd && (
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(r)} title={lang === "hi" ? "हटाएं" : "Delete"}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleVcLink(r)} title="Video meeting">
                <Video className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </div>
          );
        },
      },
    ],
    [lang, canAdd, types, hStatuses]
  );

  return (
    <>
      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold">Hearing</h2>
          {canAdd && (
            <Button type="button" size="sm" variant="outline" onClick={openAdd} className="h-7 px-3 text-xs font-medium bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add
            </Button>
          )}
        </div>
        <DataTable
          columns={columns as any}
          data={hearingList as any}
          isLoading={isLoading}
          isError={!!isError}
          emptyTitle="No hearings scheduled"
          emptyMessage="Hearing schedule will appear here."
          onRefetch={() => refetch()}
          defaultPageSize={10}
        />
      </section>

      <CustomModal open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }} className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden">
        <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
          <HearingForm hearing={editing} onClose={() => { setOpen(false); setEditing(null); }} onSuccess={() => { refetch(); setOpen(false); setEditing(null); }} />
        </CustomModalBody>
      </CustomModal>
    </>
  );
}
