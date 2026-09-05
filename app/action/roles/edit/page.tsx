"use client";

import { useSearchParams } from "next/navigation";
import { RoleEditForm } from "../../../administrator/masters/rbac/(actions)/role";

export default function RoleEditPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const handleSuccess = () => {
    if (window.opener) {
      window.opener.postMessage("REFRESH_ROLE_LIST", "*");
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
        Error: Role ID parameter is required.
      </div>
    );
  }

  return (
    <RoleEditForm id={id} onSuccess={handleSuccess} onCancel={handleCancel} />
  );
}
