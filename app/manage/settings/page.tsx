"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ManageIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/manage/settings/profile");
  }, [router]);
  return (
    <div className="p-6 text-sm text-muted-foreground">Redirecting...</div>
  );
}
