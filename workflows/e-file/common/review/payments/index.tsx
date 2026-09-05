"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n";
import toast from "react-hot-toast";
import { CommonsApiServices } from "@/lib";
import { useReviewPayments } from "./use-review-payments";
import { ReviewPaymentTable } from "./payment-table";
import { ReviewPaymentModals, ReviewPaymentProofModal } from "./payment-modals";

export function ReviewPaymentsSection({ caseNumber, isSubmitted, checklistAddRef }: { caseNumber: string; isSubmitted: boolean; checklistAddRef?: React.MutableRefObject<(() => void) | null> }) {
  const { t } = useTranslation();
  const { payments, loading, refetch, hasProof } = useReviewPayments(caseNumber, true);
  const [modal, setModal] = useState<{ open: boolean; paymentId?: string | null; isEditing?: boolean; isView?: boolean }>({ open: false });
  const [proofPayment, setProofPayment] = useState<any | null>(null);

  const openAdd = () => setModal({ open: true, paymentId: null });
  useEffect(() => {
    if (checklistAddRef) checklistAddRef.current = openAdd;
    return () => { if (checklistAddRef) checklistAddRef.current = null; };
  }, [checklistAddRef]);

  const handleDelete = async (id: string) => {
    try {
      const { apiClient } = await import("@/lib/api-client");
      await apiClient.delete(`/payments/${id}/`);
      toast.success(t("case.review.payments_deleted") || "Payment deleted");
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <ReviewPaymentTable
        payments={payments}
        loading={loading}
        isSubmitted={isSubmitted}
        onAdd={openAdd}
        onView={(p) => setModal({ open: true, paymentId: String(p.id), isView: true })}
        onDelete={handleDelete}
        onUploadProof={(p) => setProofPayment(p)}
        hasProof={hasProof}
        title={t("case.review.payments_table_title") || "Payments"}
        addLabel={t("case.review.payments_add_btn") || "Add"}
        emptyText={t("case.review.payments_empty") || "No payments yet. Add an offline entry and upload proof."}
      />

      <ReviewPaymentModals caseNumber={caseNumber} paymentModal={modal} onOpenChange={(o) => setModal((m) => ({ ...m, open: o }))} onSuccess={refetch} />
      <ReviewPaymentProofModal open={!!proofPayment} onOpenChange={(o) => !o && setProofPayment(null)} payment={proofPayment} onSuccess={refetch} />
    </div>
  );
}
