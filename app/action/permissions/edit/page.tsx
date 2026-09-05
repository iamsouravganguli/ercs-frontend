"use client";

import { useSearchParams } from "next/navigation";
import { PermissionEditForm } from "../../../administrator/masters/rbac/(actions)/permission";

export default function PermissionEditPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

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

  if (!id) {
    return (
      <div className="p-6 text-sm text-destructive font-medium h-screen w-full bg-background flex items-center justify-center">
        Error: Permission ID parameter is required.
      </div>
    );
  }

  return (
    <PermissionEditForm
      id={id}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
