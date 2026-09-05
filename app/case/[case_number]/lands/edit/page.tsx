"use client";

import { useSearchParams } from "next/navigation";
import { LandForm } from "../(land-form)";

export default function LandEditPage() {
  const searchParams = useSearchParams();
  const landId = searchParams.get("id");
  const isView = searchParams.get("view") === "true";

  return <LandForm landId={landId} isEditing={true} isView={isView} />;
}
