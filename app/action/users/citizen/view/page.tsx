"use client";

import { useSearchParams } from "next/navigation";
import { CitizenViewForm } from "../../../../administrator/masters/rbac/(actions)/user";

export default function CitizenViewPage() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "";

  const handleClose = () => {
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

  return <CitizenViewForm username={username} onClose={handleClose} />;
}
