"use client";

import { useParams } from "next/navigation";

export default function CommunicationPage() {
  const { case_number } = useParams();
  return <div className="flex-1 p-4 bg-muted">{case_number}</div>;
}
