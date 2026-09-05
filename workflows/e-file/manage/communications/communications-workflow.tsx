"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, ClipboardCheck, FileUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomModal, CustomModalBody } from "@/components/ui/custom-modal";
import { DataTable, ColumnDef } from "@/components/ui/data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/i18n";
import {
  useProfileDetail,
  useCaseCommunicationList,
  useCaseCommunicationDelete,
  canModifyManageTab,
  isCitizenAdvocate as isCitizenAdvocateRole,
} from "@/lib";
import { CommunicationForm } from "@/workflows/e-file/common/communications/communication-form";
import { CommunicationDocUploadModal } from "@/workflows/e-file/common/communications/communication-doc-upload-modal";
import { CommunicationIssueModal } from "@/workflows/e-file/common/communications/communication-issue-modal";
import { ServiceReportModal } from "@/workflows/e-file/common/communications/service-report-modal";
import toast from "react-hot-toast";

type CommRow = any;
function getCommStatusVariant(code: string): "success" | "error" | "warning" | "info" | "neutral" {
  const c = (code || "").toUpperCase();
  if (c === "COMM_SERVED" || c === "SR_SERVED") return "success";
  if (c === "COMM_FAILED" || c === "COMM_CANCELLED" || c === "SR_CANCELLED") return "error";
  if (c === "COMM_RETURNED" || c === "SR_RETURNED") return "warning";
  if (c === "COMM_ISSUED" || c === "COMM_DISPATCHED" || c === "SR_PENDING") return "info";
  return "neutral";
}
function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default function ManageCommunicationsWorkflow() {
  const { caseId } = useParams<{ caseId: string }>();
  const case_number = caseId as string;
  const { t, lang } = useTranslation() as any;
  const { data: profileData } = useProfileDetail();
  const role = (profileData as any)?.role || (profileData as any)?.user?.role || (profileData as any)?.data?.role || "";
  const roleUpper = String(role || "").toUpperCase();
  const isCitizenAdvocate = isCitizenAdvocateRole(role);
  const canAdd = canModifyManageTab(role);
  const listQ = useCaseCommunicationList(case_number);
  const rows: CommRow[] = (listQ.data as any)?.result?.data || (listQ.data as any)?.data || [];
  const delMut = useCaseCommunicationDelete();
  const [open, setOpen] = useState(false);
  const [reportRow, setReportRow] = useState<CommRow | null>(null);
  const [uploadRow, setUploadRow] = useState<CommRow | null>(null);
  const [issueRow, setIssueRow] = useState<CommRow | null>(null);

  const columns = useMemo<ColumnDef<CommRow>[]>(() => [
    { accessorKey: "communication_id", header: "ID", cell: ({ row }) => <span className="text-xs font-medium">{row.original.communication_id || `COM-${row.original.id}`}</span> },
    { accessorKey: "type", header: lang === "hi" ? "प्रकार" : "Type", cell: ({ row }) => {
      const c = row.original;
      const raw = c.communication_type_detail ? (lang==="hi" ? c.communication_type_detail.name || c.communication_type_detail.name_en : c.communication_type_detail.name_en || c.communication_type_detail.name) : "—";
      return <span className="text-xs font-medium capitalize">{raw === "—" ? "—" : capitalize(String(raw))}</span>;
    }},
    { accessorKey: "issue_date", header: lang === "hi" ? "जारी दिनांक" : "Issue Date", cell: ({ row }) => {
      const d = row.original.issue_date || row.original.created_at;
      if (!d) return <span className="text-xs text-muted-foreground">—</span>;
      try { return <span className="text-xs font-medium">{new Date(d).toLocaleDateString(lang==="hi"?"hi-IN":"en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>; } catch { return <span className="text-xs text-muted-foreground">—</span>; }
    }},
    { accessorKey: "status", header: lang === "hi" ? "स्थिति" : "Status", cell: ({ row }) => {
      const sd = row.original.status_detail;
      const code = sd?.code || "";
      const label = sd ? (lang==="hi"? sd.name || sd.name_en : sd.name_en || sd.name) : "—";
      if (!sd) return <span className="text-xs text-muted-foreground">—</span>;
      return <StatusBadge variant={getCommStatusVariant(code)}>{label}</StatusBadge>;
    }},
    { id: "actions", header: lang === "hi" ? "कार्रवाई" : "Actions", cell: ({ row }) => {
      const r = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          {canAdd && (
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground" onClick={()=> setIssueRow(r)} title={lang==="hi" ? "जारी करें" : "Issue"}>
              <Check className="w-4 h-4" />
            </Button>
          )}
          {canAdd && (
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground" onClick={()=> setUploadRow(r)} title={lang==="hi" ? "दस्तावेज़ अपलोड" : "Upload Document"}>
              <FileUp className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground" onClick={()=> setReportRow(r)} title="Service Report">
            <ClipboardCheck className="w-4 h-4" />
          </Button>
          {canAdd && (
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive" onClick={async()=>{
              if(!confirm(lang==="hi"?"क्या इस संचार को हटाना चाहते हैं?":"Delete this communication?")) return;
              try { await delMut.mutateAsync({ caseNumber: case_number, pk: r.id }); toast.success(lang==="hi"?"संचार हटा दिया गया":"Communication deleted"); } catch(e:any){ toast.error(e?.message || "Failed"); }
            }} title={lang==="hi"?"हटाएं":"Delete"}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      );
    }},
  ], [lang, canAdd, case_number]);

  const refetch = () => (listQ as any).refetch?.();
  return (
    <>
      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold">{t("case.communication.list_title") ?? "Communications"}</h2>
          {canAdd && (<Button type="button" size="sm" variant="outline" onClick={()=>setOpen(true)} className="h-7 px-3 text-xs font-medium bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"><Plus className="w-3.5 h-3.5 mr-1.5" /> Add</Button>)}
        </div>
        <DataTable columns={columns as any} data={rows} isLoading={(listQ as any).isLoading} isError={!!(listQ as any).isError} emptyTitle={t("case.communication.no_communications") ?? "No communications yet"} emptyMessage={t("case.communication.empty_message") ?? "Communications will appear here once created."} onRefetch={refetch} defaultPageSize={10} />
      </section>

      <CustomModal open={open} onOpenChange={setOpen} className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden">
        <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
          <CommunicationForm onClose={()=>setOpen(false)} onSuccess={()=>{ refetch(); setOpen(false); }} />
        </CustomModalBody>
      </CustomModal>

      <CustomModal open={!!issueRow} onOpenChange={(o)=>{ if(!o) setIssueRow(null); }} className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden">
        <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
          {issueRow && (<CommunicationIssueModal communication={issueRow} caseNumber={case_number} onClose={()=> setIssueRow(null)} onSuccess={()=> { refetch(); setIssueRow(null); }} />)}
        </CustomModalBody>
      </CustomModal>

      <CustomModal open={!!uploadRow} onOpenChange={(o)=>{ if(!o) setUploadRow(null); }} className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden">
        <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
          {uploadRow && (<CommunicationDocUploadModal communication={uploadRow} caseNumber={case_number} onClose={()=> setUploadRow(null)} onSuccess={()=> { refetch(); }} />)}
        </CustomModalBody>
      </CustomModal>

      <CustomModal open={!!reportRow} onOpenChange={(o)=>{ if(!o) setReportRow(null); }} className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden">
        <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
          {reportRow && (<ServiceReportModal openCommunication={reportRow} onClose={()=> setReportRow(null)} onSuccess={()=> {}} />)}
        </CustomModalBody>
      </CustomModal>
    </>
  );
}
