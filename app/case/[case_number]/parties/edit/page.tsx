"use client";

import { useSearchParams } from "next/navigation";
import { PartyForm } from "../(party-form)";

export default function PartyEditPage() {
  const searchParams = useSearchParams();
  const partyId = searchParams.get("id");
  const isView = searchParams.get("view") === "true";

  return <PartyForm partyId={partyId} isEditing={true} isView={isView} />;
}
