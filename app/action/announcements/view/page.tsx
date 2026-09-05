"use client";

import { useSearchParams } from "next/navigation";
import { AnnouncementViewForm } from "../../../administrator/announcements/(actions)/announcement";

export default function AnnouncementViewPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const handleClose = () => {
    window.close();
  };

  if (!id) {
    return (
      <div className="p-6 text-sm text-destructive font-medium h-screen w-full bg-background flex items-center justify-center">
        Error: Announcement ID parameter is required.
      </div>
    );
  }

  return <AnnouncementViewForm id={id} onClose={handleClose} />;
}
