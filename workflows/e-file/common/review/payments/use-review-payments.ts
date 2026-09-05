"use client";

import { useEffect, useState, useCallback } from "react";
import { CommonsApiServices } from "@/lib";
import { apiClient } from "@/lib/api-client";

export function useReviewPayments(caseNumber: string, enabled: boolean) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [proofMap, setProofMap] = useState<Record<string, boolean>>({});

  const fetchPayments = useCallback(async () => {
    if (!caseNumber || !enabled) return;
    setLoading(true);
    try {
      const res: any = await CommonsApiServices.PaymentOrderList({
        "filters[object_id]": caseNumber,
        ordering: "-created_at",
      } as any);
      const list = res?.result?.data || res?.data || [];
      setPayments(list);

      const ids = list.map((p: any) => p.id);
      if (ids.length) {
        const checks = await Promise.all(
          ids.map(async (id: any) => {
            try {
              const r: any = await apiClient.get(`/doc/linked/PaymentOrderModel/${id}/`);
              const docs = r?.data?.result?.data || r?.data?.data || r?.data?.results || [];
              return { id: String(id), has: Array.isArray(docs) && docs.length > 0 };
            } catch {
              return { id: String(id), has: false };
            }
          }),
        );
        const m: Record<string, boolean> = {};
        checks.forEach((c) => (m[c.id] = c.has));
        setProofMap(m);
      } else {
        setProofMap({});
      }
    } catch {
      setPayments([]);
      setProofMap({});
    } finally {
      setLoading(false);
    }
  }, [caseNumber, enabled]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);


  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data === "refetch-documents" || e.data === "refetch-payments") fetchPayments();
    };
    const onFocus = () => fetchPayments();
    window.addEventListener("message", onMsg);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("message", onMsg);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchPayments]);

  const hasProof = useCallback((id: string | number) => !!proofMap[String(id)], [proofMap]);

  return { payments, loading, refetch: fetchPayments, hasProof, proofMap };
}
