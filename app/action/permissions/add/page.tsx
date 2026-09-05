"use client";

import { PermissionAddForm } from "../../../administrator/masters/rbac/(actions)/permission";

export default function PermissionAddPage() {
  const handleSuccess = () => {
    if (window.opener) {
      window.opener.postMessage("REFRESH_PERMISSION_LIST", "*");
    }
    setTimeout(() => {
      window.close();
    }, 1500);
  };

  const handleCancel = () => {
    window.close();
  };

  return (
    <PermissionAddForm onSuccess={handleSuccess} onCancel={handleCancel} />
  );
}
