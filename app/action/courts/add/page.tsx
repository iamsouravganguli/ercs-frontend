"use client";

import { CourtAddForm } from "../../../administrator/masters/courts/(actions)/court";

export default function CourtAddPage() {
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

  return <CourtAddForm onSuccess={handleSuccess} onCancel={handleCancel} />;
}
