"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PartyStats } from "./party-stats";
import { PartyModals, PartyDeleteConfirmDialog } from "./party-modals";
import { PartyTable } from "./party-table";
import {
  useCasePartyList,
  useCasePartyDelete,
  PartyDetail,
  CommonsApiServices,
  useCaseDetail,
  useSessionCheck,
} from "@/lib";
import { useTranslation } from "@/i18n";
import { isAllowedAdd, isAllowedEdit, isAllowedDelete } from "@/lib";
import { useEFileFooter } from "../../../../app/case/e-file/[caseId]/layout";

const CLAIMANT_CODES = [
  "CIT_PLAINTIFF",
  "CIT_APPELLANT",
  "CIT_REVISIONIST",
  "CIT_PETITIONER",
] as const;
const isClaimant = (code?: string | null) =>
  !!code && (CLAIMANT_CODES as readonly string[]).includes(code);
const isOpponent = (code?: string | null) => !!code && !isClaimant(code);

const getPartyStatusVariant = (
  code: string,
): "success" | "error" | "warning" | "info" | "neutral" => {
  switch (code) {
    case "PARTY_ACTIVE":
    case "PARTY_OTP_VERIFIED":
    case "PARTY_VERIFIED":
      return "success";
    case "PARTY_DECEASED":
    case "PARTY_DROPPED":
      return "error";
    case "PARTY_PENDING":
      return "warning";
    default:
      return "neutral";
  }
};


export default function EFilePartiesPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const case_number = caseId as string;
  const { t, lang } = useTranslation();

  const caseDetail = useCaseDetail(case_number as string);
  const isSubmitted = caseDetail.data?.result?.data?.is_submitted === true;
  const session = useSessionCheck();
  const role = String((session.data as unknown as { result?: { data?: { role?: string } } })?.result?.data?.role ?? "").toUpperCase();
  const isViewOnly = ["SA", "RI", "RSI"].includes(role);
  const canAdd = !isSubmitted && !isViewOnly && isAllowedAdd(role, ["CT", "AD", "PO", "CO", "CC"]);
  const canEdit = !isSubmitted && !isViewOnly && isAllowedEdit(role, ["CT", "AD", "PO", "CO", "CC"]);
  const canDelete = !isSubmitted && !isViewOnly && isAllowedDelete(role, ["CT", "AD", "PO", "CO"]);


  const partyListQuery = useCasePartyList(case_number);
  const parties = partyListQuery.data?.result?.data || [];

  const claimantParties = parties.filter((p) =>
    isClaimant(p.party_type_detail?.code),
  );
  const opponentParties = parties.filter((p) =>
    isOpponent(p.party_type_detail?.code),
  );
  const hasClaimant = claimantParties.length >= 1;
  const hasOpponent = opponentParties.length >= 1;

  const hasClaimantVerified =
    claimantParties.length > 0 &&
    claimantParties.every(
      (p) =>
        p.is_phone_verified ||
        ["PARTY_OTP_VERIFIED", "PARTY_VERIFIED"].includes(
          p.status_detail?.code || "",
        ),
    );
  const hasPendingClaimant = claimantParties.some(
    (p) => p.status_detail?.code === "PARTY_PENDING",
  );
  const canProceedParties = hasClaimant && hasOpponent && hasClaimantVerified;

  const footerCtx = useEFileFooter();
  useEffect(() => {
    if (!footerCtx.setFooterConfig) return;
    footerCtx.setFooterConfig({
      nextDisabled: isSubmitted ? true : !canProceedParties,
      nextLabel: t("case.details.next_btn"),
    });
    return () => footerCtx.setFooterConfig?.({});

  }, [canProceedParties, isSubmitted, t]);

  const deleteMutation = useCasePartyDelete();


  const [verifyingParty, setVerifyingParty] = useState<PartyDetail | null>(
    null,
  );
  const [otpKey, setOtpKey] = useState<string>("");
  const [otpValue, setOtpValue] = useState<string>("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [debugOtp, setDebugOtp] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");
  const [otpSuccess, setOtpSuccess] = useState<string>("");


  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data === "refetch-parties") {
        partyListQuery.refetch();
      }
    };

    const handleFocus = () => {
      partyListQuery.refetch();
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [partyListQuery]);

  const handleStartVerify = async (party: PartyDetail) => {
    const identifier = party.contact_phone;
    if (!identifier) {
      alert(
        "Phone number is required to send OTP. Please add phone number for this party.",
      );
      return;
    }

    setVerifyingParty(party);
    setOtpKey("");
    setOtpValue("");
    setOtpError("");
    setOtpSuccess("");
    setDebugOtp("");
    setIsSendingOtp(true);

    try {
      const channel = "SMS" as const;
      const res = await CommonsApiServices.generateOTP({
        identifier,
        purpose: "VERIFY_PARTY",
        channel,
      });

      if (res.result?.data?.otp_key) {
        setOtpKey(res.result.data.otp_key);
        if (res.result.data.debug_otp) {
          setDebugOtp(res.result.data.debug_otp);
        }
      } else {
        setOtpError("Failed to generate OTP key. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to generate OTP:", err);
      setOtpError(
        err?.message ||
          "Failed to send OTP. Please check the contact information.",
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmitOtp = async () => {
    if (!verifyingParty || !otpValue || otpValue.length < 6 || !otpKey) {
      setOtpError("Please enter a valid 6-digit OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      const res = await CommonsApiServices.CasePartyVerifyOTPService(
        case_number,
        verifyingParty.id,
        {
          otp_key: otpKey,
          otp: otpValue,
        },
      );

      if (res.success) {
        setOtpSuccess("OTP verified successfully!");
        partyListQuery.refetch();
        setTimeout(() => {
          setVerifyingParty(null);
        }, 1500);
      } else {
        setOtpError(res.message || "Invalid OTP. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to verify OTP:", err);
      setOtpError(err?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verifyingParty) return;
    const identifier = verifyingParty.contact_phone;
    if (!identifier) return;

    setIsSendingOtp(true);
    setOtpError("");
    setOtpSuccess("");
    setOtpValue("");

    try {
      const channel = "SMS" as const;
      const res = await CommonsApiServices.generateOTP({
        identifier,
        purpose: "VERIFY_PARTY",
        channel,
      });

      if (res.result?.data?.otp_key) {
        setOtpKey(res.result.data.otp_key);
        setOtpSuccess("OTP resent successfully!");
        if (res.result.data.debug_otp) {
          setDebugOtp(res.result.data.debug_otp);
        }
      }
    } catch (err: any) {
      console.error("Failed to resend OTP:", err);
      setOtpError(err?.message || "Failed to resend OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };


  const [partyModal, setPartyModal] = useState<{
    open: boolean;
    partyId?: string | null;
    isEditing?: boolean;
    isView?: boolean;
  }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<PartyDetail | null>(null);
  const openAdd = () =>
    setPartyModal({
      open: true,
      partyId: null,
      isEditing: false,
      isView: false,
    });
  const openEdit = (p: PartyDetail, isView = false) =>
    setPartyModal({
      open: true,
      partyId: String(p.id),
      isEditing: !isView,
      isView,
    });

  const removeParty = async (id: string | number) => {
    try {
      await deleteMutation.mutateAsync({ case_no: case_number, pk: id });
    } catch (err) {
      console.error("Failed to delete party:", err);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PartyStats parties={parties} />

        <PartyTable
          parties={parties}
          isSubmitted={isSubmitted}
          onAdd={canAdd ? openAdd : undefined}
          onView={(p) => openEdit(p, true)}
          onEdit={canEdit ? (p) => openEdit(p) : undefined}
          onDelete={
            canDelete
              ? (id) => {
                  const p = parties.find((x) => String(x.id) === String(id));
                  if (p) setDeleteTarget(p);
                }
              : undefined
          }
          onVerify={handleStartVerify}
        />

        {hasPendingClaimant && (
          <Card className="py-0! gap-0! overflow-hidden border border-amber-200 dark:border-amber-900/40 rounded-xl bg-card">
            <CardHeader className="px-6 py-3 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30">
              <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                {t("case.parties.action_required_title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 px-6">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("case.parties.action_required_desc")}
              </p>
            </CardContent>
          </Card>
        )}
        {(!hasClaimant || !hasOpponent) && (
          <Card className="py-0! gap-0! overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl bg-card">
            <CardContent className="p-6 space-y-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("case.parties.validation_required_desc")}
              </p>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${hasClaimant ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"}`}
                >
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${hasClaimant ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}
                  >
                    {hasClaimant ? "✓" : "!"}
                  </span>
                  {hasClaimant
                    ? t("case.parties.validation_claimant_done")
                    : t("case.parties.validation_claimant_missing")}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${hasOpponent ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"}`}
                >
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${hasOpponent ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}
                  >
                    {hasOpponent ? "✓" : "!"}
                  </span>
                  {hasOpponent
                    ? t("case.parties.validation_opponent_done")
                    : t("case.parties.validation_opponent_missing")}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <PartyModals
        partyModal={partyModal}
        onPartyModalChange={(o) => setPartyModal((p) => ({ ...p, open: o }))}
        onPartySuccess={() => partyListQuery.refetch()}
        verifyingParty={verifyingParty}
        onVerifyingChange={(open) => {
          if (!open) setVerifyingParty(null);
        }}
        otpValue={otpValue}
        onOtpChange={setOtpValue}
        isVerifyingOtp={isVerifyingOtp}
        isSendingOtp={isSendingOtp}
        onSubmitOtp={handleSubmitOtp}
        onResendOtp={handleResendOtp}
        debugOtp={debugOtp}
        t={t as any}
      />

      <PartyDeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync({
              case_no: case_number,
              pk: deleteTarget.id,
            });
          } catch {}
          setDeleteTarget(null);
        }}
        isPending={deleteMutation.isPending}
      />

      {(otpError || otpSuccess) && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          {otpError && (
            <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 px-4 py-2 rounded-xl shadow-lg">
              ⚠️ {otpError}
            </p>
          )}
          {otpSuccess && (
            <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl shadow-lg">
              ✨ {otpSuccess}
            </p>
          )}
        </div>
      )}
    </>
  );
}

