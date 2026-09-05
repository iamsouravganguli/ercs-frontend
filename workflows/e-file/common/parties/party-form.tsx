"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PhoneField } from "@/components/ui/phone-field";
import { EmailField } from "@/components/ui/email-field";

import { ZipCodeField } from "@/components/ui/zipcode-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { OtpCustomModal } from "@/components/ui/otp-custom-modal";
import { PartyFormData, createPartySchema, isClaimantCode } from "./context";
import { useTranslation } from "@/i18n";

import {
  usePartyTypeList,
  usePartyNatureList,
  useRelationtTypeList,
  useGenderList,
  useIdentityProofTypeList,
  useLifeStatusList,
  useCasePartyCreate,
  useCasePartyUpdate,
  useCasePartyDetail,
  useSessionCheck,
  useStatusList,
  applyBackendErrors,
  getLabel,
} from "@/lib";
import { isAdministrative, isAllowed } from "@/lib";
import { TextFieldV2 } from "@/components/ui/text-field-v2";

import {
  CLAIMANT_CODES,
  GOVT_CODES,
  PARTY_NATURE_COLORS,
  PARTY_TYPE_COLORS,
  getPartyTypeColor,
} from "@/lib";
import { EntityStatusPanel } from "../entity-status-panel";

interface PartyFormProps {
  partyId?: string | null;
  isEditing?: boolean;
  isView?: boolean;
  onClose?: () => void;
  onSuccess?: (party?: unknown) => void;
}

export function PartyForm({
  partyId,
  isEditing = false,
  isView = false,
  onClose,
  onSuccess,
}: PartyFormProps) {
  const params = useParams() as unknown as Record<string, string>;
  const case_number = params.case_number || params.caseId;
  const { t, lang } = useTranslation();

  const partyTypeList = usePartyTypeList();
  const partyNatureList = usePartyNatureList();
  const relationTypeList = useRelationtTypeList();
  const genderList = useGenderList();
  const lifeStatusList = useLifeStatusList();

  const sessionCheck = useSessionCheck();
  const statusList = useStatusList({ "filters[type]": "PARTY" });
  const sessionRoleRaw =
    (
      sessionCheck.data as unknown as {
        result?: { data?: { role?: unknown } };
        role?: unknown;
      }
    )?.result?.data?.role ??
    (sessionCheck.data as unknown as { role?: unknown })?.role ??
    "";
  const userRole = String(
    typeof sessionRoleRaw === "string"
      ? sessionRoleRaw
      : (sessionRoleRaw as { code?: string })?.code || "",
  ).toUpperCase();
  const isCourtRole = isAdministrative(userRole);
  const isAllowedToUpdateStatus = isAllowed(userRole, [
    "PO",
    "CO",
    "CC",
  ]);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showOtpForCreate, setShowOtpForCreate] = useState(false);
  const [otpKeyForCreate, setOtpKeyForCreate] = useState("");
  const [otpValueForCreate, setOtpValueForCreate] = useState("");
  const [isSendingOtpForCreate, setIsSendingOtpForCreate] = useState(false);
  const [isVerifyingOtpForCreate, setIsVerifyingOtpForCreate] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [debugOtpForCreate, setDebugOtpForCreate] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const createMutation = useCasePartyCreate();
  const updateMutation = useCasePartyUpdate();
  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    isVerifyingOtpForCreate ||
    isSendingOtpForCreate;
  const partySchema = React.useMemo(
    () => createPartySchema(t as unknown as (key: string) => string),
    [t],
  );
  const form = useForm<PartyFormData>({
    resolver: zodResolver(partySchema) as any,
    defaultValues: {
      id: partyId || crypto.randomUUID(),
      party_type_code: "CIT_PLAINTIFF",
      party_nature_code: "INDIVIDUAL",
      full_name: "",
      gender: "",
      life_status: "",
      relation_type: "",
      relation_name: "",
      contact_phone: "",
      contact_email: "",
      contact_address: "",
      contact_pincode: "",
      identity_type: "",
      identity_number: "",
      is_phone_verified: false,
      status_code: "",
    },
  });


  useEffect(() => {
    setCurrentStep(1);
  }, [partyId, isEditing]);

  const watchPartyNature = form.watch("party_nature_code");
  const watchPartyTypeCode = form.watch("party_type_code");
  const isClaimantSelected = isClaimantCode(watchPartyTypeCode);
  const identityTypeList = useIdentityProofTypeList(
    watchPartyNature
      ? { "filters[party_nature__code]": watchPartyNature }
      : undefined,
  );

  useEffect(() => {
    if (watchPartyNature !== "INDIVIDUAL") {
      form.setValue("life_status", "alive", { shouldValidate: true });
    }
  }, [watchPartyNature, form]);

  const partyDetailQuery = useCasePartyDetail(case_number, partyId as string, {
    enabled: (isEditing || isView) && !!partyId,
  });
  const existing = partyDetailQuery.data?.result?.data;


  useEffect(() => {
    if ((isEditing || isView) && partyId && existing) {
      form.reset({
        id: String(existing.id),
        party_type_code: existing.party_type_detail?.code || "",
        party_nature_code: existing.relation_type
          ? "INDIVIDUAL"
          : "ORGANIZATION",
        full_name: existing.full_name,
        gender: existing.gender_detail?.code || "",
        life_status: existing.life_status_detail?.code || "alive",
        relation_type: existing.relation_type_detail?.code || "",
        relation_name: existing.relation_name || "",
        contact_phone: existing.contact_phone || "",
        contact_email: existing.contact_email || "",
        contact_address: existing.contact_address || "",
        contact_pincode: existing.contact_pincode || "",
        identity_type: existing.identity_type_detail?.code || "",
        identity_number: existing.identity_number || "",
        is_phone_verified: existing.is_phone_verified || false,
        status_code: existing.status_detail?.code || "",
      });
    }
  }, [isEditing, isView, partyId, form, partyDetailQuery.data]);
  const handleUpdateStatusOnly = async () => {
    if (!case_number || !partyId) return;

    const existing = partyDetailQuery.data?.result?.data;
    if (!existing) return;

    const selectedStatusCode = form.getValues("status_code");
    if (!selectedStatusCode) {
      alert("Please select a status first.");
      return;
    }

    const statusId = statusList.data?.result?.data?.find(
      (s: any) => s.code === selectedStatusCode,
    )?.id;
    if (!statusId) {
      alert("Invalid status selected.");
      return;
    }

    setIsUpdatingStatus(true);

    const payload = {
      party_type: existing.party_type,
      full_name: existing.full_name,
      gender: existing.gender,
      life_status: existing.life_status,
      relation_type: existing.relation_type,
      relation_name: existing.relation_name,
      contact_phone: existing.contact_phone,
      contact_email: existing.contact_email,
      contact_address: existing.contact_address,
      contact_pincode: existing.contact_pincode,
      identity_type: existing.identity_type,
      identity_number: existing.identity_number,
      status: statusId,
    };

    try {
      await updateMutation.mutateAsync({
        case_no: case_number,
        pk: partyId,
        payload,
      });
      alert("Party status updated successfully!");
      partyDetailQuery.refetch();
      if (window.opener) {
        try {
          window.opener.postMessage("refetch-parties", window.location.origin);
        } catch (e) {
          window.opener.postMessage("refetch-parties", "*");
        }
      }
    } catch (err: any) {
      console.error("Failed to update party status:", err);
      alert(err?.message || "Failed to update party status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const buildPayload = (data: PartyFormData) => {
    const partyTypeId = partyTypeList.data?.result?.data?.find(
      (t) => t.code === data.party_type_code,
    )?.id;
    const genderId = genderList.data?.result?.data?.find(
      (g) => g.code === data.gender,
    )?.id;
    const lifeStatusId = lifeStatusList.data?.result?.data?.find(
      (l) => l.code === data.life_status,
    )?.id;
    const relationTypeId = relationTypeList.data?.result?.data?.find(
      (r) => r.code === data.relation_type,
    )?.id;
    const identityTypeId = identityTypeList.data?.result?.data?.find(
      (i) => i.code === data.identity_type,
    )?.id;
    return {
      party_type: partyTypeId || 0,
      full_name: data.full_name,
      gender: genderId || null,
      life_status: lifeStatusId || null,
      relation_type: relationTypeId || null,
      relation_name: data.relation_name || null,
      contact_phone: data.contact_phone || null,
      contact_email: data.contact_email || null,
      contact_address: data.contact_address || null,
      contact_pincode: data.contact_pincode || null,
      identity_type: identityTypeId || null,
      identity_number: data.identity_number || null,
    };
  };

  const doCreateParty = async (payload: any) => {
    if (isSaving) return;
    try {
      let resultParty: any = null;
      if (isEditing && partyId) {
        const res: any = await updateMutation.mutateAsync({
          case_no: case_number,
          pk: partyId,
          payload,
        });
        resultParty = res?.result?.data || res?.data;
      } else {
        const res: any = await createMutation.mutateAsync({
          case_no: case_number,
          payload,
        });
        resultParty = res?.result?.data || res?.data;
      }
      if (window.opener) {
        try {
          window.opener.postMessage("refetch-parties", window.location.origin);
        } catch (e) {
          window.opener.postMessage("refetch-parties", "*");
        }
      }
      if (onSuccess) onSuccess(resultParty);
      if (onClose) onClose();
      else window.close();
    } catch (err: any) {
      console.error("Failed to save party to API", err);
      applyBackendErrors(
        form,
        err.errors,
        err.message || "Failed to save party",
      );
      const hasFieldErrors = err.errors && Object.keys(err.errors).length > 0;
      if (!hasFieldErrors) {
        alert(err.message || "Failed to save party");
      }
    }
  };


  const handleFinalSave = async () => {
    if (isSaving) return;
    if (!case_number) return;

    const okAll = await form.trigger();
    if (!okAll) {

      for (let i = 0; i < steps.length; i++) {
        const fields = steps[i].fields as any;
        const okStep = await form.trigger(fields);
        if (!okStep) {
          setCurrentStep(steps[i].id);
          break;
        }
        if (i === 1 && watchPartyNature === "INDIVIDUAL") {
          const okRel = await form.trigger([
            "relation_type",
            "relation_name",
          ] as any);
          if (!okRel) {
            setCurrentStep(2);
            break;
          }
        }
      }
      return;
    }
    const data = form.getValues() as PartyFormData;
    const payload = buildPayload(data);
    const isClaimant = isClaimantCode(data.party_type_code);


    if (!isClaimant) {
      await doCreateParty(payload);
      return;
    }


    if (isCourtRole) {
      await doCreateParty(payload);
      return;
    }


    const needsOtpBeforeCreate =
      !isEditing && !isView && isClaimant && !!data.contact_phone;
    if (needsOtpBeforeCreate) {
      setPendingPayload(payload);
      setOtpValueForCreate("");
      setOtpKeyForCreate("");
      setDebugOtpForCreate("");
      setIsSendingOtpForCreate(true);
      setShowOtpForCreate(true);
      try {
        const res: any = await (
          await import("@/lib")
        ).CommonsApiServices.generateOTP({
          identifier: data.contact_phone!,
          purpose: "VERIFY_PARTY",
          channel: "SMS",
        });
        if (res?.result?.data?.otp_key) {
          setOtpKeyForCreate(res.result.data.otp_key);
          if (res.result.data.debug_otp)
            setDebugOtpForCreate(res.result.data.debug_otp);
        }
      } catch (e: any) {
        alert(e?.message || "Failed to send OTP");
        setShowOtpForCreate(false);
      } finally {
        setIsSendingOtpForCreate(false);
      }
      return;
    }

    const originalPhone = (existing as any)?.contact_phone || "";
    const newPhone = data.contact_phone || "";
    const phoneChanged =
      isEditing &&
      !!partyId &&
      isClaimant &&
      originalPhone !== newPhone &&
      !!newPhone;
    if (phoneChanged) {
      setPendingPayload(payload);
      setOtpValueForCreate("");
      setOtpKeyForCreate("");
      setDebugOtpForCreate("");
      setIsSendingOtpForCreate(true);
      setShowOtpForCreate(true);
      try {
        const res: any = await (
          await import("@/lib")
        ).CommonsApiServices.generateOTP({
          identifier: newPhone,
          purpose: "VERIFY_PARTY",
          channel: "SMS",
        });
        if (res?.result?.data?.otp_key) {
          setOtpKeyForCreate(res.result.data.otp_key);
          if (res.result.data.debug_otp)
            setDebugOtpForCreate(res.result.data.debug_otp);
        }
      } catch (e: any) {
        alert(e?.message || "Failed to send OTP");
        setShowOtpForCreate(false);
      } finally {
        setIsSendingOtpForCreate(false);
      }
      return;
    }

    await doCreateParty(payload);
  };

  const onSubmit = form.handleSubmit(async () => {

    if (currentStep !== 3) {
      const fields = steps[currentStep - 1]?.fields as any;
      if (fields) {
        const ok = await form.trigger(fields);
        if (ok) setCurrentStep((s) => Math.min(3, s + 1));
      }
      return;
    }
    await handleFinalSave();
  });

  const handleVerifyAndCreate = async () => {
    if (isSaving) return;
    if (!pendingPayload || !otpKeyForCreate || otpValueForCreate.length < 6)
      return;
    setIsVerifyingOtpForCreate(true);
    try {

      const payloadWithOtp = {
        ...pendingPayload,
        otp_key: otpKeyForCreate,
        otp: otpValueForCreate,
      };
      setShowOtpForCreate(false);
      await doCreateParty(payloadWithOtp);
      setPendingPayload(null);
      setOtpValueForCreate("");
      setOtpKeyForCreate("");
      setDebugOtpForCreate("");
    } catch (e: any) {

      setShowOtpForCreate(true);
      alert(
        e?.response?.data?.message ||
          e?.errors?.otp?.[0] ||
          e?.message ||
          "Invalid OTP",
      );
    } finally {
      setIsVerifyingOtpForCreate(false);
    }
  };

  const handleResendOtpForCreate = async () => {
    if (!pendingPayload?.contact_phone) return;
    setIsSendingOtpForCreate(true);
    try {
      const res: any = await (
        await import("@/lib")
      ).CommonsApiServices.generateOTP({
        identifier: pendingPayload.contact_phone,
        purpose: "VERIFY_PARTY",
        channel: "SMS",
      });
      if (res?.result?.data?.otp_key) {
        setOtpKeyForCreate(res.result.data.otp_key);
        if (res.result.data.debug_otp)
          setDebugOtpForCreate(res.result.data.debug_otp);
      }
    } catch (e: any) {
      alert(e?.message || "Failed to resend OTP");
    } finally {
      setIsSendingOtpForCreate(false);
    }
  };

  const handleCancel = () => {

    form.reset({
      id: crypto.randomUUID(),
      party_type_code: "CIT_PLAINTIFF",
      party_nature_code: "INDIVIDUAL",
      full_name: "",
      gender: "",
      life_status: "alive",
      relation_type: "",
      relation_name: "",
      contact_phone: "",
      contact_email: "",
      contact_address: "",
      contact_pincode: "",
      identity_type: "",
      identity_number: "",
      is_phone_verified: false,
      status_code: "",
    });
    setCurrentStep(1);
    setPendingPayload(null);
    setShowOtpForCreate(false);
    setOtpKeyForCreate("");
    setOtpValueForCreate("");
    setDebugOtpForCreate("");
    if (onClose) onClose();
    else window.close();
  };

  const steps = [
    {
      id: 1,
      label: t("case.parties.form.classification"),
      fields: ["party_nature_code", "party_type_code"] as const,
    },
    {
      id: 2,
      label: t("case.parties.form.personal_details"),
      fields: (isEditing || isView
        ? ["gender", "full_name", "contact_phone", "life_status"]
        : ["gender", "full_name", "contact_phone"]) as unknown as readonly (
        | "gender"
        | "full_name"
        | "contact_phone"
        | "life_status"
      )[],
    },
    {
      id: 3,
      label:
        watchPartyNature === "INDIVIDUAL"
          ? t("case.parties.form.identity_address")
          : t("case.parties.form.document_address"),
      fields: [
        "identity_type",
        "identity_number",
        "contact_pincode",
        "contact_address",
      ] as const,
    },
  ];
  const handleNext = async () => {
    const fields = steps[currentStep - 1]?.fields as any;
    if (fields) {
      const ok = await form.trigger(fields);
      if (!ok) return;

      if (currentStep === 2 && watchPartyNature === "INDIVIDUAL") {
        const ok2 = await form.trigger([
          "relation_type",
          "relation_name",
        ] as any);
        if (!ok2) return;
      }
    }
    setCurrentStep((s) => Math.min(3, s + 1));
  };
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden relative">
      <Form {...form}>
        <div
          onKeyDown={(e) => {
            if (e.key === "Enter" && currentStep !== 3) {
              const t = e.target as HTMLElement | null;
              if (t && t.tagName === "TEXTAREA") return;
              e.preventDefault();
            }
          }}
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-1 flex-col overflow-hidden h-full min-h-0"
        >
          {}
          <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
            {}
            <div className="sticky top-0 z-20 flex items-center h-14 px-6 border-b bg-card shrink-0">
              <h1 className="text-lg font-semibold tracking-tight">
                {isView
                  ? t("case.parties.form.view_title")
                  : isEditing
                    ? t("case.parties.form.edit_title")
                    : t("case.parties.form.add_title")}
              </h1>
            </div>

            {}
            {!isView && (
              <div className="shrink-0 h-1 bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            )}

            {}
            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
              {isView ? (
                partyDetailQuery.isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden animate-pulse"
                      >
                        <div className="h-10 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800" />
                        <div className="p-6 space-y-4">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
                              <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
                            </div>
                            <div className="space-y-2">
                              <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
                              <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {}
                    <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                        {t("case.parties.form.classification")}
                      </div>
                      <div className="p-6 grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.parties.form.party_nature")}
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full shrink-0 ${PARTY_NATURE_COLORS[(existing as any)?.party_nature_detail?.code || ((existing as any)?.relation_type ? "INDIVIDUAL" : "ORGANIZATION")] || "bg-zinc-400"}`}
                            />
                            <p className="text-sm font-medium text-foreground">
                              {getLabel(
                                (existing as any)?.party_nature_detail as any,
                                lang,
                              ) ||
                                ((existing as any)?.relation_type
                                  ? lang === "hi"
                                    ? "व्यक्ति"
                                    : "Individual"
                                  : lang === "hi"
                                    ? "संगठन"
                                    : "Organization")}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.parties.form.party_type")}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${PARTY_TYPE_COLORS[(existing as any)?.party_type_detail?.code] || getPartyTypeColor((existing as any)?.party_type_detail?.code || "") || "bg-zinc-400"}`} />
                            <p className="text-sm font-medium text-foreground">
                              {getLabel((existing as any)?.party_type_detail as any, lang) || "—"}
                            </p>
                            {(existing as any)?.party_type_detail?.code && (
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none border ${(CLAIMANT_CODES as readonly string[]).includes((existing as any).party_type_detail.code) ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300" : (GOVT_CODES as readonly string[]).includes((existing as any).party_type_detail.code) ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300"}`}
                              >
                                {(CLAIMANT_CODES as readonly string[]).includes(
                                  (existing as any).party_type_detail.code,
                                )
                                  ? t("case.parties.form.group_claimant")
                                  : (GOVT_CODES as readonly string[]).includes(
                                        (existing as any).party_type_detail
                                          .code,
                                      )
                                    ? t("case.parties.form.group_govt")
                                    : t("case.parties.form.group_opponent")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

                    {}
                    <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                        {t("case.parties.form.personal_details")}
                      </div>
                      <div className="p-6 grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.parties.form.gender")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {getLabel(
                              (existing as any)?.gender_detail as any,
                              lang,
                            ) || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.parties.form.full_name")}
                          </p>
                          <p className="text-sm font-medium text-foreground wrap-break-word">
                            {(existing as any)?.full_name || "—"}
                          </p>
                        </div>
                        {(existing as any)?.relation_type_detail && (
                          <>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {t("case.parties.form.relation_type")}
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                {lang === "hi"
                                  ? (existing as any).relation_type_detail
                                      .name ||
                                    (existing as any).relation_type_detail
                                      .name_en
                                  : (existing as any).relation_type_detail
                                      .name_en ||
                                    (existing as any).relation_type_detail.name}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {t("case.parties.form.relation_name")}
                              </p>
                              <p className="text-sm font-medium text-foreground wrap-break-word">
                                {(existing as any)?.relation_name || "—"}
                              </p>
                            </div>
                          </>
                        )}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.parties.form.email")}
                          </p>
                          <p className="text-sm font-medium text-foreground break-all">
                            {(existing as any)?.contact_email || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.parties.form.phone")}
                          </p>
                          <p className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
                            <span>
                              {(existing as any)?.contact_phone || "—"}
                            </span>
                            {(existing as any)?.contact_phone &&
                              ((existing as any)?.is_phone_verified ? (
                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                              ) : (
                                <XIcon className="h-4 w-4 text-red-500 shrink-0" />
                              ))}
                          </p>
                        </div>
                        {(existing as any)?.life_status_detail && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              {t("case.parties.form.life_status")}
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {getLabel(
                                (existing as any)?.life_status_detail as any,
                                lang,
                              ) || "—"}
                            </p>
                          </div>
                        )}
                      </div>
                    </section>

                    {}
                    <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                        {(existing as any)?.relation_type
                          ? t("case.parties.form.identity_address")
                          : t("case.parties.form.document_address")}
                      </div>
                      <div className="p-6 grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {(existing as any)?.relation_type
                              ? t("case.parties.form.identity_type")
                              : t("case.parties.form.document_type")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {getLabel(
                              (existing as any)?.identity_type_detail as any,
                              lang,
                            ) || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {(existing as any)?.relation_type
                              ? t("case.parties.form.identity_number")
                              : t("case.parties.form.document_number")}
                          </p>
                          <p className="text-sm font-medium text-foreground break-all">
                            {(existing as any)?.identity_number || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.parties.form.pincode")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(existing as any)?.contact_pincode || "—"}
                          </p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.parties.form.full_address")}
                          </p>
                          <p className="text-sm font-medium text-foreground wrap-break-word whitespace-pre-wrap">
                            {(existing as any)?.contact_address || "—"}
                          </p>
                        </div>
                      </div>
                    </section>

                    {isAllowedToUpdateStatus && (existing as any)?.status_detail && (
                      <EntityStatusPanel control={form.control as any} name={"status_code" as any} title={t("case.parties.form.status_panel_title") as string} statusList={statusList} isUpdating={isUpdatingStatus} onUpdate={handleUpdateStatusOnly} existingCode={(existing as any)?.status_detail?.code} watchCode={form.watch("status_code") as string} />
                    )}
                  </div>
                )
              ) : (
                <>
                  {currentStep === 1 && (
                    <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                        {t("case.parties.form.classification")}
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4 items-start">
                          <CustomComboboxField
                            control={form.control}
                            name="party_nature_code"
                            label={t("case.parties.form.party_nature")}
                            placeholder={t(
                              "case.parties.form.party_nature_placeholder",
                            )}
                            required
                            disabled={isView}
                            loading={partyNatureList.isLoading}
                            options={
                              partyNatureList?.data?.result?.data?.map(
                                (n: any) => ({
                                  label: getLabel(n, lang),
                                  value: n.code,
                                }),
                              ) || []
                            }
                            renderOption={(opt) => {
                              const color =
                                PARTY_NATURE_COLORS[String(opt.value)] ||
                                "bg-zinc-400";
                              return (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`}
                                  />
                                  <span className="truncate">{opt.label}</span>
                                </div>
                              );
                            }}
                            onSelect={() => {
                              form.setValue("relation_type", "");
                              form.setValue("relation_name", "");
                            }}
                          />
                          <div className="space-y-1.5">
                            <CustomComboboxField
                              control={form.control}
                              name="party_type_code"
                              label={t("case.parties.form.party_type")}
                              placeholder={t(
                                "case.parties.form.party_type_placeholder",
                              )}
                              required
                              disabled={isView}
                              loading={partyTypeList.isLoading}
                              options={
                                partyTypeList?.data?.result?.data?.map(
                                  (t: any) => ({
                                    label: getLabel(t, lang),
                                    value: t.code,
                                  }),
                                ) || []
                              }
                              renderOption={(opt) => {
                                const code = String(opt.value);
                                const color =
                                  PARTY_TYPE_COLORS[code] ||
                                  getPartyTypeColor(code);
                                const isClaimant =
                                  (
                                    CLAIMANT_CODES as readonly string[]
                                  ).includes(code) ||
                                  code === "ADV_PLAINTIFF" ||
                                  code === "ADV_APPELLANT";
                                const isGovt = (
                                  GOVT_CODES as readonly string[]
                                ).includes(code);
                                return (
                                  <div className="flex items-center gap-2 w-full">
                                    <span
                                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`}
                                    />
                                    <span className="truncate flex-1">
                                      {opt.label}
                                    </span>
                                    <span
                                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none shrink-0 border ${isClaimant ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20" : isGovt ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20" : code.startsWith("ADV_") ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20" : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20"}`}
                                    >
                                      {isClaimant
                                        ? t("case.parties.form.group_claimant")
                                        : isGovt
                                          ? t("case.parties.form.group_govt")
                                          : code.startsWith("ADV_")
                                            ? t(
                                                "case.parties.form.group_advocate",
                                              )
                                            : t(
                                                "case.parties.form.group_opponent",
                                              )}
                                    </span>
                                  </div>
                                );
                              }}
                            />
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-none text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />{" "}
                                {t("case.parties.form.group_claimant_full")}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />{" "}
                                {t("case.parties.form.group_opponent_full")}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />{" "}
                                {t("case.parties.form.group_govt")}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />{" "}
                                {t("case.parties.form.group_advocate")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {currentStep === 2 && (
                    <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                        {t("case.parties.form.personal_details")}
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4 items-start">
                          <CustomComboboxField
                            control={form.control}
                            name="gender"
                            label={t("case.parties.form.gender")}
                            placeholder={t(
                              "case.parties.form.gender_placeholder",
                            )}
                            required
                            disabled={isView}
                            loading={genderList.isLoading}
                            options={
                              genderList?.data?.result?.data?.map((g: any) => ({
                                label: getLabel(g, lang),
                                value: g.code,
                              })) || []
                            }
                          />
                          <TextFieldV2
                            control={form.control}
                            name="full_name"
                            label={t("case.parties.form.full_name")}
                            placeholder={t(
                              "case.parties.form.full_name_placeholder",
                            )}
                            required
                            autoComplete="off"
                            readonly={isView}
                          />

                          {watchPartyNature === "INDIVIDUAL" && (
                            <div className="md:col-span-2 grid md:grid-cols-2 gap-4 items-start">
                              <CustomComboboxField
                                control={form.control}
                                name="relation_type"
                                label={t("case.parties.form.relation_type")}
                                placeholder={t(
                                  "case.parties.form.relation_type_placeholder",
                                )}
                                required
                                disabled={isView}
                                loading={relationTypeList.isLoading}
                                options={
                                  relationTypeList?.data?.result?.data?.map(
                                    (r: any) => ({
                                      label: getLabel(r, lang),
                                      value: r.code,
                                    }),
                                  ) || []
                                }
                              />
                              <TextFieldV2
                                control={form.control}
                                name="relation_name"
                                label={t("case.parties.form.relation_name")}
                                placeholder={t(
                                  "case.parties.form.relation_name_placeholder",
                                )}
                                required
                                autoComplete="off"
                                readonly={isView}
                              />
                            </div>
                          )}

                          <EmailField
                            control={form.control}
                            name="contact_email"
                            label={t("case.parties.form.email")}
                            placeholder={t(
                              "case.parties.form.email_placeholder",
                            )}
                            autoComplete="off"
                            readonly={isView}
                          />
                          <PhoneField
                            control={form.control}
                            name="contact_phone"
                            label={
                              t("case.parties.form.phone") +
                              (isClaimantSelected ? " *" : "")
                            }
                            placeholder={t(
                              "case.parties.form.phone_placeholder",
                            )}
                            autoComplete="off"
                            readonly={isView}
                            required={isClaimantSelected}
                          />
                          {(isEditing || isView) && (existing as any)?.life_status_detail && (
                            <CustomComboboxField
                              control={form.control}
                              name="life_status"
                              label={t("case.parties.form.life_status")}
                              placeholder={t(
                                "case.parties.form.life_status_placeholder",
                              )}
                              disabled={
                                isView || watchPartyNature !== "INDIVIDUAL"
                              }
                              loading={lifeStatusList.isLoading}
                              options={
                                lifeStatusList?.data?.result?.data?.map(
                                  (l: any) => ({
                                    label: getLabel(l, lang),
                                    value: l.code,
                                  }),
                                ) || []
                              }
                            />
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {currentStep === 3 && (
                    <>
                      <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                          {watchPartyNature === "INDIVIDUAL"
                            ? t("case.parties.form.identity_address")
                            : t("case.parties.form.document_address")}
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid md:grid-cols-2 gap-4 items-start">
                            <CustomComboboxField
                              control={form.control}
                              name="identity_type"
                              label={
                                watchPartyNature === "INDIVIDUAL"
                                  ? t("case.parties.form.identity_type")
                                  : t("case.parties.form.document_type")
                              }
                              placeholder={
                                watchPartyNature === "INDIVIDUAL"
                                  ? t(
                                      "case.parties.form.identity_type_placeholder",
                                    )
                                  : t(
                                      "case.parties.form.document_type_placeholder",
                                    )
                              }
                              disabled={isView}
                              loading={identityTypeList.isLoading}
                              options={
                                identityTypeList?.data?.result?.data?.map(
                                  (i: any) => ({
                                    label: getLabel(i, lang),
                                    value: i.code,
                                  }),
                                ) || []
                              }
                            />
                            <TextFieldV2
                              control={form.control}
                              name="identity_number"
                              label={
                                watchPartyNature === "INDIVIDUAL"
                                  ? t("case.parties.form.identity_number")
                                  : t("case.parties.form.document_number")
                              }
                              placeholder={
                                watchPartyNature === "INDIVIDUAL"
                                  ? t(
                                      "case.parties.form.identity_number_placeholder",
                                    )
                                  : t(
                                      "case.parties.form.document_number_placeholder",
                                    )
                              }
                              autoComplete="off"
                              readonly={isView}
                              onChange={(e) => {
                                form.setValue(
                                  "identity_number",
                                  e.target.value.toUpperCase(),
                                  {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  },
                                );
                              }}
                            />
                            <ZipCodeField
                              control={form.control}
                              name="contact_pincode"
                              label={t("case.parties.form.pincode")}
                              placeholder={t(
                                "case.parties.form.pincode_placeholder",
                              )}
                              autoComplete="off"
                              readonly={isView}
                            />

                            <div className="hidden md:block" />

                            <div className="md:col-span-2">
                              <TextareaField
                                control={form.control}
                                name="contact_address"
                                label={t("case.parties.form.full_address")}
                                placeholder={t(
                                  "case.parties.form.full_address_placeholder",
                                )}
                                autoComplete="off"
                                readonly={isView}
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      {partyId && isView && (
                        <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                          <div className="px-4 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-foreground flex items-center justify-between">
                            <span>
                              {t("case.parties.form.status_panel_title")}
                            </span>
                            {existing?.status_detail && (
                              <span className="text-[11px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
                                {t("case.parties.form.current_status")}:{" "}
                                {getLabel(existing.status_detail as any, lang)}
                              </span>
                            )}
                          </div>
                          <div className="p-4 space-y-3">
                            <CustomComboboxField
                              control={form.control}
                              name="status_code"
                              label={t("case.parties.form.select_status")}
                              placeholder={t(
                                "case.parties.form.select_status_placeholder",
                              )}
                              loading={statusList.isLoading}
                              options={
                                statusList?.data?.result?.data
                                  ?.filter((s: any) => s.type === "PARTY")
                                  ?.map((s: any) => ({
                                    label: getLabel(s, lang),
                                    value: s.code,
                                  })) || []
                              }
                            />

                            {form.watch("status_code") !==
                              (existing as any)?.status_detail?.code && (
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  onClick={handleUpdateStatusOnly}
                                  disabled={isUpdatingStatus}
                                  className="px-6"
                                >
                                  {isUpdatingStatus
                                    ? t("case.parties.form.updating_status")
                                    : t("case.parties.form.update_status")}
                                </Button>
                              </div>
                            )}
                          </div>
                        </section>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {}
            {isView ? (
              <div className="flex items-center justify-end border-t bg-card px-6 py-3 z-10 shrink-0">
                <Button
                  variant="default"
                  type="button"
                  className="px-6"
                  onClick={handleCancel}
                >
                  {t("case.parties.form.close_btn")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between border-t bg-card px-6 py-3 z-10 shrink-0">
                <Button
                  variant="outline"
                  type="button"
                  className="px-5"
                  onClick={handleCancel}
                >
                  {t("case.parties.form.cancel_btn")}
                </Button>
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      type="button"
                      className="px-5"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                  )}
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      className="px-6 bg-primary hover:bg-primary/90"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="px-6"
                      onClick={handleFinalSave}
                      disabled={isSaving}
                    >
                      {isSaving
                        ? t("common.loading") || "Saving..."
                        : t("case.parties.form.save_btn")}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Form>
      <OtpCustomModal
        open={showOtpForCreate}
        onOpenChange={setShowOtpForCreate}
        phone={pendingPayload?.contact_phone}
        value={otpValueForCreate}
        onChange={(v) => setOtpValueForCreate(v.replace(/\D/g, "").slice(0, 6))}
        isLoading={isVerifyingOtpForCreate}
        isSending={isSendingOtpForCreate}
        onSubmit={handleVerifyAndCreate}
        onResend={handleResendOtpForCreate}
        debugOtp={debugOtpForCreate}
        title={t("otp.title_phone")}
        subtitle={t("otp.subtitle")}
        verifyText={t("otp.verify")}
        verifyingText={t("otp.verifying")}
        resendText={t("otp.resend")}
        resendInText={t("otp.resend_in")}
        sendingText={t("otp.sending")}
      />
    </div>
  );
}
