"use client";

import { useSearchParams } from "next/navigation";
import { PermissionViewForm } from "../../../administrator/masters/rbac/(actions)/permission";

export default function PermissionViewPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const handleClose = () => {
    window.close();
  };

  if (!id) {
    return (
      <div className="p-6 text-sm text-destructive font-medium h-screen w-full bg-background flex items-center justify-center">
        Error: Permission ID parameter is required.
      </div>
    );
  }

  return <PermissionViewForm id={id} onClose={handleClose} />;
}
