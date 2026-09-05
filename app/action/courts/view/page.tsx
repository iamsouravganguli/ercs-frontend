"use client";

import { useSearchParams } from "next/navigation";
import { CourtViewForm } from "../../../administrator/masters/courts/(actions)/court";

export default function CourtViewPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const handleClose = () => {
    window.close();
  };

  if (!id) {
    return (
      <div className="p-6 text-sm text-destructive font-medium h-screen w-full bg-background flex items-center justify-center">
        Error: Court ID parameter is required.
      </div>
    );
  }

  return <CourtViewForm id={id} onClose={handleClose} />;
}
