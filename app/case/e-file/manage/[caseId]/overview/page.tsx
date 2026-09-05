"use client";
import { PendencyAlert } from "@/workflows/e-file/common/case-details/pendency-alert";
import { CurrentProgress } from "@/workflows/e-file/common/timeline/current-progress";

export default function ManageOverviewPage() {
  return (
    <div className="pb-6">
      <div className="grid md:grid-cols-2 gap-4">
        <CurrentProgress />
        <PendencyAlert />
      </div>
    </div>
  );
}
