"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import { DocumentForm } from "./document-form";
import { DocumentStats } from "./document-stats";
import {
  DocumentUploadModal,
  DocumentPreviewModal,
  DocumentDeleteConfirmDialog,
} from "./document-modals";
import { DocumentViewModal } from "./document-view-modal";
import { DocumentTable } from "./document-table";

import { FileText, UploadCloud, Eye, Trash2, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import toast from "react-hot-toast";
import {
  CommonsApiServices,
  useStatusList,
  useSessionCheck,
  useCaseDetail,
  useCaseDocumentList,
  getFileUrl,
} from "@/lib";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/i18n";
import { useEFileFooter } from "../../../../app/case/e-file/[caseId]/layout";

const getDocStatusVariant = (
  code: string,
): "success" | "error" | "warning" | "info" | "neutral" => {
  switch (code) {
    case "DOCUMENT_VERIFIED":
      return "success";
    case "DOCUMENT_REJECTED":
    case "DOCUMENT_FAILED":
      return "error";
    case "DOCUMENT_IN_REVIEW":
      return "warning";
    case "DOCUMENT_UPLOADED":
      return "info";
    default:
      return "neutral";
  }
};

export default function EFileDocumentsPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const case_number = caseId as string;
  const { t, lang } = useTranslation();

  const caseDetail = useCaseDetail(case_number as string);
  const isSubmitted = caseDetail.data?.result?.data?.is_submitted === true;

  const sessionCheck = useSessionCheck();
  const role = sessionCheck.data?.result?.data?.role?.toUpperCase();
  const isViewOnly = ["SA", "RI", "RSI"].includes(role || "");
  const isCourtUser = ["PO", "CO", "CC"].includes(role || "");
  const canModify = !isSubmitted && !isViewOnly;

  const statusQuery = useStatusList({ "filters[type]": "DOCUMENT" } as any);
  const statusRes = (statusQuery as any).data;
  const statuses = (statusRes as any)?.result?.data || [];


  const docListQuery = useCaseDocumentList(case_number);
  const docListRaw: any = docListQuery.data as unknown as { result?: { data?: unknown[] }; data?: unknown[] };
  const rawDocs: any[] = (docListRaw?.result?.data ?? (docListRaw as unknown as { data?: { results?: unknown[] } })?.data?.results ?? (docListRaw as unknown as { results?: unknown[] })?.results ?? (Array.isArray(docListRaw) ? docListRaw : [])) as unknown[];
  const files = rawDocs.map((d: any) => ({
    id: String(d.id),
    name: d.file_name || "Unknown",
    type_of_doc: d.type_of_doc || "Other",
    remarks: d.remarks || "",
    status: d.status,
    status_detail: d.status_detail,
    file_url: d.file_url,
    size: d.file_size_mb ? d.file_size_mb * 1024 * 1024 : 0,
    type: d.mime_type || "application/pdf",
    uploaded_at: d.created_at || new Date().toISOString(),
  }));
  const loading = docListQuery.isLoading;
  const refreshDocuments = () => docListQuery.refetch();


  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data === "refetch-documents") {
        docListQuery.refetch();
      }
    };
    const handleFocus = () => {
      docListQuery.refetch();
    };
    window.addEventListener("message", handleMessage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", handleFocus);
    };

  }, [case_number]);

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const openAddPopup = () => setDocModalOpen(true);

  async function updateFileStatus(id: string, statusId: number) {
    if (isNaN(Number(id))) {
      toast.error("Can only update status of documents saved to the server.");
      return;
    }
    try {
      await CommonsApiServices.CaseDocumentUpdateStatusService(id, statusId);
      toast.success(t("case.documents.status_updated_toast"));
      await refreshDocuments();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error(
        err?.message || t("case.documents.status_update_failed_toast"),
      );
    }
  }

  async function deleteFile(id: string) {
    if (!confirm(t("case.documents.confirm_delete"))) return;
    try {
      if (!isNaN(Number(id))) {
        await CommonsApiServices.CaseDocumentDeleteService(id);
      }
      toast.success(t("case.documents.deleted_toast"));
      await refreshDocuments();
    } catch (err: any) {
      console.error("Failed to delete document:", err);
      toast.error(t("case.documents.delete_failed_toast"));
    }
  }


  const hasMinDocs = files.length >= 1;
  const documentsFooterCtx = useEFileFooter();
  useEffect(() => {
    documentsFooterCtx.setFooterConfig?.({
      nextDisabled: isSubmitted ? true : !hasMinDocs,
    });
    return () => documentsFooterCtx.setFooterConfig?.({});

  }, [hasMinDocs, isSubmitted]);

  const [viewDoc, setViewDoc] = useState<any | null>(null);
  const [isUpdatingDocStatus, setIsUpdatingDocStatus] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  function previewFile(doc: any) {
    const url = doc.file
      ? URL.createObjectURL(doc.file)
      : getFileUrl(doc.file_url);
    if (!url) {
      toast.error("File URL is missing or file is corrupted.");
      return;
    }
    setPreviewDoc(doc);
    setPreviewUrl(url);
  }

  async function handleViewStatusUpdate(code: string) {
    const target = viewDoc;
    if (!target) return;
    const statusesList: any[] = (statusRes as any)?.result?.data || [];
    const match = statusesList.find((s: any) => s.code === code);
    const statusId = match?.id;
    if (!statusId) {
      toast.error("Invalid status selected");
      return;
    }
    setIsUpdatingDocStatus(true);
    try {
      await CommonsApiServices.CaseDocumentUpdateStatusService(String(target.id), Number(statusId));
      toast.success(t("case.documents.status_updated_toast") || "Status updated");
      await refreshDocuments();

      setViewDoc((prev: any) => prev ? { ...prev, status: statusId, status_detail: match } : prev);
    } catch (err: any) {
      toast.error(err?.message || t("case.documents.status_update_failed_toast") || "Failed to update status");
    } finally {
      setIsUpdatingDocStatus(false);
    }
  }


  useEffect(() => {
    if (!previewDoc && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewDoc, previewUrl]);

  function formatSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }

  return (
    <div className="space-y-6">
      <DocumentStats files={files} />

      <DocumentTable
        files={files}
        loading={loading}
        isSubmitted={isSubmitted || isViewOnly}
        isCourtUser={isCourtUser}
        statuses={statuses}
        onAdd={canModify ? openAddPopup : undefined}
        onView={(doc: any) => {

          const full = typeof doc === "string" ? files.find((x) => x.id === doc) : doc;
          if (full) setViewDoc(full);
          else if (doc) setViewDoc(doc);
        }}
        onDelete={canModify ? (id) => {
          const d = files.find((x) => x.id === id);
          if (d) setDeleteTarget(d);
        } : undefined}
        onUpdateStatus={canModify ? updateFileStatus : undefined}
      />

      <DocumentUploadModal
        open={docModalOpen}
        onOpenChange={setDocModalOpen}
        onSuccess={() => {
          refreshDocuments();
          setDocModalOpen(false);
        }}
      />

      <DocumentViewModal
        open={!!viewDoc}
        doc={viewDoc}
        onOpenChange={(o) => {
          if (!o) setViewDoc(null);
        }}
        onPreview={(d) => previewFile(d)}
        statusList={statusQuery as any}
        isUpdating={isUpdatingDocStatus}
        isCourtUser={isCourtUser && !isSubmitted}
        onStatusUpdate={handleViewStatusUpdate}
      />

      <DocumentPreviewModal
        previewDoc={previewDoc}
        previewUrl={previewUrl}
        onClose={() => {
          if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
          setPreviewDoc(null);
          setPreviewUrl("");
        }}
      />

      <DocumentDeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            if (!isNaN(Number(deleteTarget.id))) {
              await CommonsApiServices.CaseDocumentDeleteService(
                deleteTarget.id,
              );
            }
            toast.success(t("case.documents.deleted_toast"));
            await refreshDocuments();
          } catch (err: any) {
            toast.error(t("case.documents.delete_failed_toast"));
          }
          setDeleteTarget(null);
        }}
        docName={deleteTarget?.original_name}
      />
    </div>
  );
}
