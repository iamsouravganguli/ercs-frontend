"use client";

import { useSearchParams } from "next/navigation";
import { AnnouncementEditForm } from "../../../administrator/announcements/(actions)/announcement";

export default function AnnouncementEditPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const handleSuccess = () => {
    if (window.opener) {
      window.opener.postMessage("REFRESH_ANNOUNCEMENT_LIST", "*");
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
        Error: Announcement ID parameter is required.
      </div>
    );
  }

  return (
    <AnnouncementEditForm
      id={id}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
