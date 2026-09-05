"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Pencil,
  Plus,
  UserCircle2,
  Eye,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OtpCustomModal } from "@/components/ui/otp-custom-modal";
import { useCasePartyList, useCasePartyDelete, PartyDetail, useCaseDetail } from '@/lib/query';
import { CommonsApiServices } from '@/lib/services';
import { useTranslation } from "@/i18n";
import { StatusBadge } from "@/components/ui/status-badge";

const getPartyStatusVariant = (
  code: string,
): "success" | "error" | "warning" | "info" | "neutral" => {
  switch (code) {
    case "PARTY_ACTIVE":
    case "PARTY_OTP_VERIFIED":
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


export default function PartiesPage() {
  const { case_number } = useParams<{ case_number: string }>();
  const router = useRouter();
  const { t, lang } = useTranslation();

  const caseDetail = useCaseDetail(case_number as string);
  const isSubmitted = caseDetail.data?.result?.data?.is_submitted === true;

  const partyListQuery = useCasePartyList(case_number);
  const parties = partyListQuery.data?.result?.data || [];

  const hasClaimant = parties.some(
    (p) =>
      p.party_type_detail?.code?.includes("PLAINTIFF") ||
      p.party_type_detail?.code?.includes("APPELLANT") ||
      p.party_type_detail?.code?.includes("PETITIONER") ||
      p.party_type_detail?.code?.includes("REVISIONIST"),
  );

  const hasOpponent = parties.some(
    (p) =>
      p.party_type_detail?.code?.includes("DEFENDANT") ||
      p.party_type_detail?.code?.includes("RESPONDENT") ||
      p.party_type_detail?.code?.includes("OPPOSITE") ||
      p.party_type_detail?.code?.includes("STATE") ||
      p.party_type_detail?.code?.includes("GAON_SABHA"),
  );

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
      alert("Phone number is required to send OTP.");
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

  const openAdd = () => {
    if (!case_number) return;
    const width = 850;
    const height = 900;

    let left = 100;
    let top = 100;
    if (typeof window !== "undefined") {
      const sX = window.screenX;
      const oW = window.outerWidth;
      const sY = window.screenY;
      const oH = window.outerHeight;
      if (
        typeof sX === "number" &&
        typeof oW === "number" &&
        !isNaN(sX) &&
        !isNaN(oW)
      ) {
        left = Math.max(0, sX + (oW - width) / 2);
      }
      if (
        typeof sY === "number" &&
        typeof oH === "number" &&
        !isNaN(sY) &&
        !isNaN(oH)
      ) {
        top = Math.max(0, sY + (oH - height) / 2);
      }
    }

    window.open(
      `/case/${case_number}/parties/add`,
      "PartyFormPopup",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
  };

  const openEdit = (p: PartyDetail, isView = false) => {
    if (!case_number) return;
    const width = 850;
    const height = 900;

    let left = 100;
    let top = 100;
    if (typeof window !== "undefined") {
      const sX = window.screenX;
      const oW = window.outerWidth;
      const sY = window.screenY;
      const oH = window.outerHeight;
      if (
        typeof sX === "number" &&
        typeof oW === "number" &&
        !isNaN(sX) &&
        !isNaN(oW)
      ) {
        left = Math.max(0, sX + (oW - width) / 2);
      }
      if (
        typeof sY === "number" &&
        typeof oH === "number" &&
        !isNaN(sY) &&
        !isNaN(oH)
      ) {
        top = Math.max(0, sY + (oH - height) / 2);
      }
    }

    window.open(
      `/case/${case_number}/parties/edit?id=${p.id}${isView ? "&view=true" : ""}`,
      "PartyFormPopup",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
  };

  const removeParty = async (id: string | number) => {
    try {
      await deleteMutation.mutateAsync({ case_no: case_number, pk: id });
    } catch (err) {
      console.error("Failed to delete party:", err);
    }
  };

  const saveAll = (redirect = false) => {
    if (!case_number) return;
    if (redirect) router.push(`/case/${case_number}/lands`);
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-neutral-950 overflow-hidden relative border-r">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-blue-100/80 dark:border-blue-900/30 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {t("case.parties.total_parties")}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {parties.length}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100/80 dark:border-blue-900/30 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {t("case.parties.claimants")}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {
                  parties.filter(
                    (p) =>
                      p.party_type_detail?.code?.includes("PLAINTIFF") ||
                      p.party_type_detail?.code?.includes("APPELLANT") ||
                      p.party_type_detail?.code?.includes("PETITIONER"),
                  ).length
                }
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100/80 dark:border-blue-900/30 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {t("case.parties.opponents")}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {
                  parties.filter(
                    (p) =>
                      p.party_type_detail?.code?.includes("DEFENDANT") ||
                      p.party_type_detail?.code?.includes("RESPONDENT") ||
                      p.party_type_detail?.code?.includes("OPPOSITE"),
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        {}
        <Card className="py-0! gap-0! overflow-hidden">
          <CardHeader className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100/80 dark:border-blue-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-left">
                <CardTitle className="text-sm font-semibold">
                  {t("case.parties.registered_parties")}
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={openAdd}
                className="w-full sm:w-auto"
                disabled={isSubmitted}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("case.parties.add_btn")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {parties.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-background border border-dashed rounded-2xl m-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("case.parties.no_parties")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {}
                <div className="hidden md:block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-border text-left">
                    <tbody className="divide-y divide-border bg-card">
                      {parties.map((p) => {
                        const isClaimant =
                          p.party_type_detail?.code?.includes("PLAINTIFF") ||
                          p.party_type_detail?.code?.includes("APPELLANT") ||
                          p.party_type_detail?.code?.includes("PETITIONER");

                        const avatarBg = isClaimant
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
                          : p.party_type_detail?.code?.includes("STATE") ||
                              p.party_type_detail?.code?.includes("GAON_SABHA")
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            : "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20";

                        const initial = p.full_name
                          ? p.full_name.charAt(0).toUpperCase()
                          : "?";

                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-muted/5 transition-colors duration-150"
                          >
                            {}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-sm ${avatarBg} shrink-0`}
                                >
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-semibold text-foreground truncate">
                                      {p.full_name ||
                                        t("case.parties.unnamed_party")}
                                    </p>
                                    {p.is_phone_verified && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px]">
                                    {p.relation_type_detail
                                      ? `${lang === "hi" ? p.relation_type_detail.name || p.relation_type_detail.name_en : p.relation_type_detail.name_en || p.relation_type_detail.name}: ${p.relation_name}`
                                      : t("case.parties.individual_org")}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/5 text-primary border border-primary/10">
                                {lang === "hi"
                                  ? p.party_type_detail?.name ||
                                    p.party_type_detail?.name_en ||
                                    "UNKNOWN"
                                  : p.party_type_detail?.name_en ||
                                    p.party_type_detail?.name ||
                                    "UNKNOWN"}
                              </span>
                            </td>

                            {}
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-foreground/80 space-y-0.5">
                              {p.contact_phone && (
                                <p className="font-mono font-medium">
                                  {p.contact_phone}
                                </p>
                              )}
                              {p.contact_email && (
                                <p className="text-muted-foreground truncate max-w-[180px]">
                                  {p.contact_email}
                                </p>
                              )}
                            </td>

                            {}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {p.status_detail && (
                                <StatusBadge
                                  variant={getPartyStatusVariant(
                                    p.status_detail.code,
                                  )}
                                >
                                  {lang === "hi"
                                    ? p.status_detail.name ||
                                      p.status_detail.name_en
                                    : p.status_detail.name_en ||
                                      p.status_detail.name}
                                </StatusBadge>
                              )}
                            </td>

                            {}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                {p.status_detail?.code === "PARTY_PENDING" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-semibold border-amber-500/30 hover:border-amber-500/60 text-amber-600 dark:text-amber-400 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 flex items-center gap-1.5 px-2.5 rounded-lg transition-all shadow-sm shrink-0 animate-pulse"
                                    onClick={() => handleStartVerify(p)}
                                    title="Verify OTP"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {t("case.parties.verify_btn")}
                                  </Button>
                                )}
                                <div className="flex items-center gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-muted"
                                    onClick={() => openEdit(p, true)}
                                    title="View Party"
                                  >
                                    <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                  </Button>
                                  {!isSubmitted && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-muted"
                                      onClick={() => openEdit(p)}
                                      title="Edit Party"
                                    >
                                      <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                    </Button>
                                  )}
                                  {!isSubmitted && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                      onClick={() => removeParty(p.id)}
                                      title="Delete Party"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {}
                <div className="block md:hidden divide-y divide-border bg-card">
                  {parties.map((p) => {
                    const isClaimant =
                      p.party_type_detail?.code?.includes("PLAINTIFF") ||
                      p.party_type_detail?.code?.includes("APPELLANT") ||
                      p.party_type_detail?.code?.includes("PETITIONER");

                    const avatarBg = isClaimant
                      ? "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
                      : p.party_type_detail?.code?.includes("STATE") ||
                          p.party_type_detail?.code?.includes("GAON_SABHA")
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                        : "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20";

                    const initial = p.full_name
                      ? p.full_name.charAt(0).toUpperCase()
                      : "?";

                    return (
                      <div
                        key={p.id}
                        className="p-4 space-y-3.5 hover:bg-muted/5 transition-colors"
                      >
                        {}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-sm ${avatarBg} shrink-0`}
                            >
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {p.full_name ||
                                    t("case.parties.unnamed_party")}
                                </p>
                                {p.is_phone_verified && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">
                                {p.relation_type_detail
                                  ? `${lang === "hi" ? p.relation_type_detail.name || p.relation_type_detail.name_en : p.relation_type_detail.name_en || p.relation_type_detail.name}: ${p.relation_name}`
                                  : t("case.parties.individual_org")}
                              </p>
                            </div>
                          </div>

                          {}
                          {p.status_detail && (
                            <StatusBadge
                              variant={getPartyStatusVariant(
                                p.status_detail.code,
                              )}
                            >
                              {lang === "hi"
                                ? p.status_detail.name ||
                                  p.status_detail.name_en
                                : p.status_detail.name_en ||
                                  p.status_detail.name}
                            </StatusBadge>
                          )}
                        </div>

                        {}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-primary/5 text-primary border border-primary/10">
                            {lang === "hi"
                              ? p.party_type_detail?.name ||
                                p.party_type_detail?.name_en ||
                                "UNKNOWN"
                              : p.party_type_detail?.name_en ||
                                p.party_type_detail?.name ||
                                "UNKNOWN"}
                          </span>

                          {p.contact_phone && (
                            <span className="font-mono text-foreground/80 bg-muted px-2 py-0.5 rounded border">
                              📱 {p.contact_phone}
                            </span>
                          )}

                          {p.contact_email && (
                            <span
                              className="text-muted-foreground bg-muted px-2 py-0.5 rounded border truncate max-w-[180px]"
                              title={p.contact_email}
                            >
                              ✉️ {p.contact_email}
                            </span>
                          )}
                        </div>

                        {}
                        <div className="flex items-center justify-between pt-1 gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                              onClick={() => openEdit(p, true)}
                              title="View Party"
                            >
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                            {!isSubmitted && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted"
                                onClick={() => openEdit(p)}
                                title="Edit Party"
                              >
                                <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            )}
                            {!isSubmitted && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                onClick={() => removeParty(p.id)}
                                title="Delete Party"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          {p.status_detail?.code === "PARTY_PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold border-amber-500/30 hover:border-amber-500/60 text-amber-600 dark:text-amber-400 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 flex items-center gap-1.5 px-2.5 rounded-lg transition-all shadow-sm shrink-0 animate-pulse"
                              onClick={() => handleStartVerify(p)}
                              title="Verify OTP"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {t("case.parties.verify_btn")}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {parties.some((p) => p.status_detail?.code === "PARTY_PENDING") && (
          <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3.5 items-start transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/25 animate-pulse">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {t("case.parties.action_required_title")}
              </h3>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                {t("case.parties.action_required_desc")}
              </p>
            </div>
          </div>
        )}
      </div>

      {}
      <div className="h-14 flex items-center justify-end border-t border-border bg-white dark:bg-neutral-950 px-8 z-10 relative shrink-0">
        <Button
          type="button"
          className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs hover:shadow-sm transition-all duration-150 disabled:bg-emerald-600/35 disabled:text-white/60 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-auto dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:disabled:bg-emerald-800/35 dark:disabled:text-white/60"
          onClick={() => saveAll(true)}
          disabled={
            isSubmitted ||
            !hasClaimant ||
            !hasOpponent ||
            parties.some((p) => p.status_detail?.code === "PARTY_PENDING")
          }
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <span>{t("case.parties.next_btn")}</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </Button>
      </div>

      {}
      <OtpCustomModal
        open={!!verifyingParty}
        onOpenChange={(open) => {
          if (!open) setVerifyingParty(null);
        }}
        phone={verifyingParty?.contact_phone || undefined}
        value={otpValue}
        onChange={(v) => setOtpValue(v.replace(/\D/g, "").slice(0, 6))}
        isLoading={isVerifyingOtp}
        isSending={isSendingOtp}
        onSubmit={handleSubmitOtp}
        onResend={handleResendOtp}
        debugOtp={debugOtp}
        title={t("otp.title_phone")}
        subtitle={t("otp.subtitle")}
        verifyText={t("otp.verify")}
        verifyingText={t("otp.verifying")}
        resendText={t("otp.resend")}
        resendInText={t("otp.resend_in")}
        sendingText={t("otp.sending")}
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
    </div>
  );
}
