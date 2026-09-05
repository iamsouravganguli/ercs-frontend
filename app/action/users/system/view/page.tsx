"use client";

import { useSearchParams } from "next/navigation";
import { SystemUserViewForm } from "../../../../administrator/masters/rbac/(actions)/user";

export default function SystemUserViewPage() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "";

  const handleClose = () => {
    window.close();
  };

  if (!username) {
    return (
      <div className="p-6 text-sm text-destructive font-medium h-screen w-full bg-background flex items-center justify-center">
        Error: Username parameter is required.
      </div>
    );
  }

  return <SystemUserViewForm username={username} onClose={handleClose} />;
}
