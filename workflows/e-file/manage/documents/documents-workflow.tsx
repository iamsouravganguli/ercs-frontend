"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import { DocumentStats } from "@/workflows/e-file/common/documents/document-stats";
import {
  DocumentUploadModal,
  DocumentPreviewModal,
  DocumentDeleteConfirmDialog,
} from "@/workflows/e-file/common/documents/document-modals";
import { DocumentViewModal } from "@/workflows/e-file/common/documents/document-view-modal";
import { DocumentTable } from "@/workflows/e-file/common/documents/document-table";
import toast from "react-hot-toast";
import {
  CommonsApiServices,
  useStatusList,
  useCaseDetail,
  useCaseDocumentList,
  useProfileDetail,
  getFileUrl,
  canModifyManageTab,
  isCitizenAdvocate as isCitizenAdvocateRole,
  isCaseViewOnly,
} from "@/lib";
import { useTranslation } from "@/i18n";
import { useEffect } from "react";

export default function ManageDocumentsWorkflow() {
  const { caseId } = useParams<{ caseId: string }>();
  const case_number = caseId as string;
  const { t, lang } = useTranslation();

  const caseDetail = useCaseDetail(case_number as string);
  const isSubmitted = caseDetail.data?.result?.data?.is_submitted === true;

  const { data: profileData } = useProfileDetail();
  const role =
    (profileData as any)?.role ||
    (profileData as any)?.user?.role ||
    (profileData as any)?.data?.role ||
    (profileData as any)?.data?.user?.role ||
    "";
  const roleUpper = String(role || "").toUpperCase();
  const isCitizenAdvocate = isCitizenAdvocateRole(role);
  const isViewOnly = isCaseViewOnly(role);
  const isCourtUser = ["PO", "CO", "CC"].includes(roleUpper);
  const canModify = canModifyManageTab(role);

  const statusQuery = useStatusList({ "filters[type]": "DOCUMENT" } as any);
  const statusRes = (statusQuery as any).data;
  const statuses = (statusRes as any)?.result?.data || [];

  const docListQuery = useCaseDocumentList(case_number);
  const docListRaw: any = docListQuery.data as unknown as {
    result?: { data?: unknown[] };
    data?: unknown[];
  };
  const rawDocs: any[] = (docListRaw?.result?.data ??
    (docListRaw as unknown as { data?: { results?: unknown[] } })?.data
      ?.results ??
    (docListRaw as unknown as { results?: unknown[] })?.results ??
    (Array.isArray(docListRaw) ? docListRaw : [])) as unknown[];
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
    const handleFocus = () => {
      docListQuery.refetch();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);

  }, [case_number]);

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewDoc, setViewDoc] = useState<any | null>(null);
  const [isUpdatingDocStatus, setIsUpdatingDocStatus] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

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
      await CommonsApiServices.CaseDocumentUpdateStatusService(
        String(target.id),
        Number(statusId),
      );
      toast.success(t("case.documents.status_updated_toast") || "Status updated");
      await refreshDocuments();
      setViewDoc((prev: any) =>
        prev ? { ...prev, status: statusId, status_detail: match } : prev,
      );
    } catch (err: any) {
      toast.error(
        err?.message ||
          t("case.documents.status_update_failed_toast") ||
          "Failed to update status",
      );
    } finally {
      setIsUpdatingDocStatus(false);
    }
  }

  useEffect(() => {
    if (!previewDoc && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewDoc, previewUrl]);

  return (
    <div className="space-y-6">
      <DocumentStats files={files} />

      <DocumentTable
        files={files}
        loading={loading}
        isSubmitted={isSubmitted || isViewOnly || isCitizenAdvocate}
        isCourtUser={isCourtUser}
        statuses={statuses}
        onAdd={canModify ? openAddPopup : undefined}
        onView={(doc: any) => {
          const full =
            typeof doc === "string"
              ? files.find((x) => x.id === doc)
              : doc;
          if (full) setViewDoc(full);
          else if (doc) setViewDoc(doc);
        }}
        onDelete={
          canModify
            ? (id) => {
                const d = files.find((x) => x.id === id);
                if (d) setDeleteTarget(d);
              }
            : undefined
        }
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
