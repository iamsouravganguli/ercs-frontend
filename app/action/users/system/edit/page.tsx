"use client";

import { useSearchParams } from "next/navigation";
import { SystemUserEditForm } from "../../../../administrator/masters/rbac/(actions)/user";

export default function SystemUserEditPage() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "";

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

  if (!username) {
    return (
      <div className="p-6 text-sm text-destructive font-medium h-screen w-full bg-background flex items-center justify-center">
        Error: Username parameter is required.
      </div>
    );
  }

  return (
    <SystemUserEditForm
      username={username}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
