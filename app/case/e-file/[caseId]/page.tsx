"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EFileCaseIdPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  useEffect(() => {
    if (caseId) router.replace(`/case/e-file/${caseId}/case-details`);
  }, [caseId, router]);
  return null;
}
