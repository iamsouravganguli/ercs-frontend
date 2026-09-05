"use client";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/i18n";

type StatusDetail = { code: string; name: string; name_en: string } | null | undefined;

function getVariant(code: string): "success" | "error" | "warning" | "info" | "neutral" {
  switch (code) {
    case "PARTY_ACTIVE":
    case "PARTY_OTP_VERIFIED":
    case "PARTY_VERIFIED":
    case "LAND_APPROVED":
    case "DOCUMENT_VERIFIED":
      return "success";
    case "PARTY_DECEASED":
    case "PARTY_DROPPED":
    case "LAND_REJECTED":
    case "DOCUMENT_REJECTED":
    case "DOCUMENT_FAILED":
      return "error";
    case "PARTY_PENDING":
    case "LAND_PENDING":
    case "DOCUMENT_IN_REVIEW":
      return "warning";
    case "DOCUMENT_UPLOADED":
      return "info";
    default:
      return "neutral";
  }
}

export function EntityStatusBadge({ detail, className }: { detail: StatusDetail; className?: string }) {
  const { lang } = useTranslation();
  if (!detail) return null;
  return (
    <StatusBadge variant={getVariant(detail.code)} className={className}>
      {lang === "hi" ? detail.name || detail.name_en : detail.name_en || detail.name}
    </StatusBadge>
  );
}
