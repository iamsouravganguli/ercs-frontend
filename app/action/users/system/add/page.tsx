"use client";

import { SystemUserAddForm } from "../../../../administrator/masters/rbac/(actions)/user";

export default function SystemUserAddPage() {
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

  return (
    <SystemUserAddForm onSuccess={handleSuccess} onCancel={handleCancel} />
  );
}
