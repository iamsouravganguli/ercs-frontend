"use client";

import { useSearchParams } from "next/navigation";
import { RoleViewForm } from "../../../administrator/masters/rbac/(actions)/role";

export default function RoleViewPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const handleClose = () => {
    window.close();
  };

  if (!id) {
    return (
      <div className="p-6 text-sm text-destructive font-medium h-screen w-full bg-background flex items-center justify-center">
        Error: Role ID parameter is required.
      </div>
    );
  }

  return <RoleViewForm id={id} onClose={handleClose} />;
}
