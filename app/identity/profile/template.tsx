"use client";

import React from "react";
import { useProfileDetail } from '@/lib/query';
import CourtLayout from "../../manage/court/layout";
import AdministratorLayout from "../../administrator/layout";

export default function ProfileTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: profileData, isLoading } = useProfileDetail();
  const user = profileData?.result?.data;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  const role = user?.role?.toUpperCase() || "";
  const isAdmin = ["SA"].includes(role);

  if (isAdmin) {
    return <AdministratorLayout>{children}</AdministratorLayout>;
  }

  return <CourtLayout>{children}</CourtLayout>;
}
