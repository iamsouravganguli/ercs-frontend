"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SupportTypeAddForm, SupportTypeEditForm } from "../forms";

function SupportTypeActionContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (id) {
    return <SupportTypeEditForm id={id} />;
  }

  return <SupportTypeAddForm />;
}

export default function AddOrEditSupportTypePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-xs text-muted-foreground animate-pulse">
          Loading...
        </div>
      }
    >
      <SupportTypeActionContent />
    </Suspense>
  );
}
