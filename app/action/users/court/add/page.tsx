"use client";

import { CourtUserAddForm } from "../../../../administrator/masters/rbac/(actions)/user";

export default function CourtUserAddPage() {
  const handleSuccess = () => {
    if (window.opener) {
      window.opener.postMessage("REFRESH_USER_LIST", "*");
    }
    setTimeout(() => {
      window.close();
    }, 1500);
  };

  const handleCancel = () => {
    window.close();
  };

  return <CourtUserAddForm onSuccess={handleSuccess} onCancel={handleCancel} />;
}
