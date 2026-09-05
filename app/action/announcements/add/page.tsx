"use client";

import { AnnouncementAddForm } from "../../../administrator/announcements/(actions)/announcement";

export default function AnnouncementAddPage() {
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

  return (
    <AnnouncementAddForm onSuccess={handleSuccess} onCancel={handleCancel} />
  );
}
