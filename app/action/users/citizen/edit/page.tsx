"use client";

import { useSearchParams } from "next/navigation";
import { CitizenEditForm } from "../../../../administrator/masters/rbac/(actions)/user";

export default function CitizenEditPage() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "";

  const handleSuccess = () => {
    if (typeof window !== "undefined") {
      window.opener?.postMessage("REFRESH_USER_LIST", "*");
      window.close();
    }
  };

  const handleCancel = () => {
    if (typeof window !== "undefined") {
      window.close();
    }
  };

  if (!username) {
    return (
      <div className="p-6 text-sm text-destructive font-medium h-screen w-full bg-background flex items-center justify-center">
        Error: Username parameter is required.
      </div>
    );
  }

  return (
    <CitizenEditForm
      username={username}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
