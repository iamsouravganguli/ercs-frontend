"use client";

import { useProfileDetail } from '@/lib/query';
import { useTranslation } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataBoundary } from "@/components/ui/data-boundary";
import { hasRole } from "@/components/ui/role-guard";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalBody,
  CustomModalFooter,
  CustomModalClose,
} from "@/components/ui/custom-modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { PasswordFieldAuth } from "@/components/ui/password-field-auth";
import { PhoneField } from "@/components/ui/phone-field";
import { EmailField } from "@/components/ui/email-field";
import { useMutation } from "@tanstack/react-query";
import { ChangePhoneService } from "../../../action/security/change-phone/services";
import { ChangeEmailService } from "../../../action/security/change-email/services";
import { ChangePasswordService } from "../../../action/security/change-password/services";
import { ChangePhoneSchema } from "../../../action/security/change-phone/validations";
import { ChangeEmailSchema } from "../../../action/security/change-email/validations";
import { ChangePasswordSchema } from "../../../action/security/change-password/validations";
import { applyBackendErrors } from '@/lib/form-error';
import { useOtp } from '@/providers/otp-provider';

function CopyRow({ label, value }: { label: string; value?: string | null }) {
  const [copied, setCopied] = useState(false);
  const display = value?.trim() ? String(value) : "";
  const isNA = !display;
  const onCopy = async () => {
    if (isNA) return;
    await navigator.clipboard.writeText(display);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 border-b border-dashed border-border/60 last:border-0">
      <span className="text-sm font-medium text-muted-foreground shrink-0">
        {label}
      </span>
      <span className="flex items-start gap-2 min-w-0 sm:justify-end sm:max-w-[65%]">
        <span className="font-medium text-[15px] sm:text-base wrap-break-word whitespace-pre-wrap text-left sm:text-right flex-1 min-w-0">
          {isNA ? "—" : display}
        </span>
        {!isNA && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </span>
    </div>
  );
}

export default function SecurityPage() {
  const { t } = useTranslation();
  const data = useProfileDetail();
  const profileData: any = data.data?.result?.data;

  const [phoneOpen, setPhoneOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);
  const { requestOtp } = useOtp();

  const phoneForm = useForm<z.infer<typeof ChangePhoneSchema>>({
    resolver: zodResolver(ChangePhoneSchema),
    defaultValues: { identifier: "", otp_key: "", otp_value: "" },
    mode: "onChange",
  });
  const emailForm = useForm<z.infer<typeof ChangeEmailSchema>>({
    resolver: zodResolver(ChangeEmailSchema),
    defaultValues: { identifier: "", otp_key: "", otp_value: "" },
    mode: "onChange",
  });
  const passForm = useForm<z.infer<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { old_password: "", new_password: "", confirm_password: "" },
    mode: "onChange",
  });

  const handlePhoneClose = (open: boolean) => {
    setPhoneOpen(open);
    if (!open) phoneForm.reset();
  };
  const handleEmailClose = (open: boolean) => {
    setEmailOpen(open);
    if (!open) emailForm.reset();
  };
  const handlePassClose = (open: boolean) => {
    setPassOpen(open);
    if (!open) passForm.reset();
  };

  const phoneMut = useMutation({
    mutationFn: (v: any) => ChangePhoneService(v),
    onSuccess: (r: any) => {
      toast.success(r?.message || "Phone updated");
      handlePhoneClose(false);
      data.refetch();
    },
    onError: (e: any) => {
      applyBackendErrors(phoneForm as any, e?.errors, e?.message);
      const msg = e?.message || "Failed";
      if (e?.errors?.otp_value || e?.errors?.otp_key || e?.errors?.otp) {
        handlePhoneClose(false);
        toast.error(msg || "OTP verification failed");
        return;
      }
      if (!phoneForm.formState.errors?.identifier) toast.error(msg);
    },
  });
  const emailMut = useMutation({
    mutationFn: (v: any) => ChangeEmailService(v),
    onSuccess: (r: any) => {
      toast.success(r?.message || "Email updated");
      handleEmailClose(false);
      data.refetch();
    },
    onError: (e: any) => {
      applyBackendErrors(emailForm as any, e?.errors, e?.message);
      const msg = e?.message || "Failed";
      if (e?.errors?.otp_value || e?.errors?.otp_key || e?.errors?.otp) {
        handleEmailClose(false);
        toast.error(msg || "OTP verification failed");
        return;
      }
      if (!emailForm.formState.errors?.identifier) toast.error(msg);
    },
  });
  const passMut = useMutation({
    mutationFn: (v: any) => ChangePasswordService(v),
    onSuccess: (r: any) => {
      toast.success(r?.message || "Password changed");
      handlePassClose(false);
    },
    onError: (e: any) => {
      applyBackendErrors(passForm as any, e?.errors, e?.message);
      const msg = e?.message || "Failed";
      if (!Object.keys(passForm.formState.errors).length) toast.error(msg);
    },
  });

  const onPhoneSubmit = () => {
    const identifier = phoneForm.getValues("identifier")?.trim();
    if (!identifier) return;
    requestOtp({
      identifier,
      purpose: "VERIFY_PROFILE_UPDATE",
      onVerified: async (otp_key, otp_value) => {
        phoneForm.setValue("otp_key", otp_key);
        phoneForm.setValue("otp_value", otp_value);
        await phoneMut.mutateAsync({
          ...phoneForm.getValues(),
          otp_key,
          otp_value,
        } as any);
      },
    });
  };
  const onEmailSubmit = () => {
    const identifier = emailForm.getValues("identifier")?.trim();
    if (!identifier) return;
    const otpIdentifier = profileData?.phone || "";
    if (!otpIdentifier) {
      toast.error("Registered phone not found for OTP");
      return;
    }
    requestOtp({
      identifier: otpIdentifier,
      purpose: "VERIFY_PROFILE_UPDATE",
      onVerified: async (otp_key, otp_value) => {
        emailForm.setValue("otp_key", otp_key);
        emailForm.setValue("otp_value", otp_value);
        await emailMut.mutateAsync({
          ...emailForm.getValues(),
          otp_key,
          otp_value,
        } as any);
      },
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
      <div className="shrink-0 h-14 flex items-center px-6 bg-white dark:bg-background sticky top-0 z-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Security
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        <DataBoundary
          isError={data.isError}
          data={profileData}
          errorTitle={t("common_status.something_wrong.label")}
          errorMessage={
            (data.error as any)?.response?.data?.message ||
            t("common_status.something_wrong.description")
          }
          onRefetch={data.refetch}
          emptyTitle={t("common_status.no_data.label")}
          emptyMessage={t("common_status.no_data.description")}
          refetchLabel={t("common_button.retry.label")}
        >
          <div className="w-full space-y-6">
            <Card className="p-5 space-y-4 border border-border/40 dark:border-border/30 shadow-sm bg-white dark:bg-card">
              <div className="text-base font-semibold">Account Information</div>
              <div className="grid">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-6 py-3 border-b border-dashed border-border/60">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">
                    Mobile
                  </span>
                  <span className="flex items-center gap-4 min-w-0 sm:justify-end sm:max-w-[70%]">
                    <span className="font-medium text-[15px] sm:text-base wrap-break-word whitespace-pre-wrap text-left sm:text-right flex-1 min-w-0">
                      {profileData?.phone || "—"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-4 text-xs shrink-0"
                      onClick={() => setPhoneOpen(true)}
                    >
                      Change
                    </Button>
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-6 py-3 border-b border-dashed border-border/60">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">
                    Email
                  </span>
                  <span className="flex items-center gap-4 min-w-0 sm:justify-end sm:max-w-[70%]">
                    <span className="font-medium text-[15px] sm:text-base wrap-break-word whitespace-pre-wrap text-left sm:text-right flex-1 min-w-0">
                      {profileData?.email || "—"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-4 text-xs shrink-0"
                      onClick={() => setEmailOpen(true)}
                    >
                      Change
                    </Button>
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-6 py-3">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">
                    Password
                  </span>
                  <span className="flex items-center gap-4 min-w-0 sm:justify-end sm:max-w-[70%]">
                    <span className="font-medium text-[15px] sm:text-base text-left sm:text-right flex-1 min-w-0">
                      ••••••••
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-4 text-xs shrink-0"
                      onClick={() => setPassOpen(true)}
                    >
                      Change
                    </Button>
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </DataBoundary>
      </div>

      {}
      <CustomModal open={phoneOpen} onOpenChange={handlePhoneClose}>
        <CustomModalClose onClose={() => handlePhoneClose(false)} />
        <CustomModalHeader>
          <CustomModalTitle>Change Mobile Number</CustomModalTitle>
          <CustomModalDescription>
            Enter your new mobile number — OTP will be sent for verification.
          </CustomModalDescription>
        </CustomModalHeader>
        <Form {...phoneForm}>
          <form
            onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
            className="space-y-4"
          >
            <CustomModalBody className="space-y-4">
              <PhoneField
                control={phoneForm.control as any}
                name="identifier"
                label="New Mobile"
                required
                placeholder=""
              />
            </CustomModalBody>
            <CustomModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePhoneClose(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={phoneMut.isPending}
                className="flex-1"
              >
                Update
              </Button>
            </CustomModalFooter>
          </form>
        </Form>
      </CustomModal>

      {}
      <CustomModal open={emailOpen} onOpenChange={handleEmailClose}>
        <CustomModalClose onClose={() => handleEmailClose(false)} />
        <CustomModalHeader>
          <CustomModalTitle>Change Email Address</CustomModalTitle>
          <CustomModalDescription>
            Enter your new email — OTP will be sent for verification.
          </CustomModalDescription>
        </CustomModalHeader>
        <Form {...emailForm}>
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            className="space-y-4"
          >
            <CustomModalBody className="space-y-4">
              <EmailField
                control={emailForm.control as any}
                name="identifier"
                label="New Email"
                required
                placeholder=""
              />
            </CustomModalBody>
            <CustomModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEmailClose(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={emailMut.isPending}
                className="flex-1"
              >
                Update
              </Button>
            </CustomModalFooter>
          </form>
        </Form>
      </CustomModal>

      {}
      <CustomModal open={passOpen} onOpenChange={handlePassClose}>
        <CustomModalClose onClose={() => handlePassClose(false)} />
        <CustomModalHeader>
          <CustomModalTitle>Change Password</CustomModalTitle>
          <CustomModalDescription>
            Enter current and new password.
          </CustomModalDescription>
        </CustomModalHeader>
        <Form {...passForm}>
          <form
            onSubmit={passForm.handleSubmit((v) => passMut.mutate(v as any))}
            className="space-y-4"
          >
            <CustomModalBody className="space-y-4">
              <PasswordFieldAuth
                control={passForm.control as any}
                name="old_password"
                label="Current Password"
                placeholder=""
                autoComplete="current-password"
              />
              <PasswordFieldAuth
                control={passForm.control as any}
                name="new_password"
                label="New Password"
                placeholder=""
                showStrength
                autoComplete="new-password"
              />
              <PasswordFieldAuth
                control={passForm.control as any}
                name="confirm_password"
                label="Confirm Password"
                placeholder=""
                autoComplete="new-password"
              />
            </CustomModalBody>
            <CustomModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePassClose(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={passMut.isPending}
                className="flex-1"
              >
                Update
              </Button>
            </CustomModalFooter>
          </form>
        </Form>
      </CustomModal>
    </div>
  );
}
