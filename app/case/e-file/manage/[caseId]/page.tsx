"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManagePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  useEffect(() => {
    if (caseId) router.replace(`/case/e-file/manage/${caseId}/overview`);
  }, [caseId, router]);
  return null;
}
