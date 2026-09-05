"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { PublicCaseDetailView } from "@/common/components/public-case-detail-view";

export default function PublicCasePage() {
  const params = useParams();
  const router = useRouter();
  const caseNumber = params?.case_number as string;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-neutral-950 p-3 sm:p-6 lg:p-8">
      <PublicCaseDetailView
        caseNumber={caseNumber}
        showBack={true}
        onBack={() => router.push("/search")}
      />
    </div>
  );
}
