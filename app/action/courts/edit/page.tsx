"use client";

import { useSearchParams } from "next/navigation";
import { CourtEditForm } from "../../../administrator/masters/courts/(actions)/court";

export default function CourtEditPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const handleSuccess = () => {
    if (window.opener) {
      window.opener.postMessage("REFRESH_COURT_LIST", "*");
    }
    setTimeout(() => {
      window.close();
    }, 1500);
  };

  const handleCancel = () => {
    window.close();
  };

  if (!id) {
    return (
      <div className="p-6 text-sm text-destructive font-medium h-screen w-full bg-background flex items-center justify-center">
        Error: Court ID parameter is required.
      </div>
    );
  }

  return (
    <CourtEditForm id={id} onSuccess={handleSuccess} onCancel={handleCancel} />
  );
}
