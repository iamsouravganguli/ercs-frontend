"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "@/i18n";
import { OtpCustomModal } from "@/components/ui/otp-custom-modal";
import { useMutation } from "@tanstack/react-query";
import { CommonsApiServices } from '@/lib/services';
import { applyBackendErrors } from '@/lib/form-error';

type OtpForm = {
  otp_key: string;
  otp_value: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getIdentifier: () => string;
  purpose?: string;
  isLoading?: boolean;
  onOtpVerified: () => void;
  onCaptchaRefresh?: () => void;
  resendCooldown?: number;
};

export type OTPModalHandle = { sendOtp: () => void };

export const OTPModal = forwardRef<OTPModalHandle, Props>(
  (
    {
      open,
      onOpenChange,
      getIdentifier,
      purpose = "SIGNUP",
      isLoading,
      onOtpVerified,
      onCaptchaRefresh,
      resendCooldown = 30,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const { control, setValue, setError } = useFormContext<OtpForm>();
    const otpValue = useWatch({ control, name: "otp_value" as any }) ?? "";
    const isResendingRef = useRef(false);

    const otpMutation = useMutation({
      mutationKey: ["OTP_SEND"],
      mutationFn: CommonsApiServices.generateOTP,

      onSuccess: (res) => {
        setValue("otp_key", res.result?.data?.otp_key ?? "");
        if (!isResendingRef.current) {
          onOpenChange(true);
        }
        isResendingRef.current = false;
      },

      onError: (err: any) => {
        onCaptchaRefresh?.();
        applyBackendErrors({ setError } as any, err.errors, err.message);
        isResendingRef.current = false;
      },
    });

    const sendOtp = () => {
      isResendingRef.current = false;
      otpMutation.mutate({
        channel: "SMS",
        identifier: getIdentifier(),
        purpose,
      });
    };

    const handleResend = () => {
      isResendingRef.current = true;
      otpMutation.mutate({
        channel: "SMS",
        identifier: getIdentifier(),
        purpose,
      });
    };

    useImperativeHandle(ref, () => ({ sendOtp }));

    const debugOtp =
      process.env.NODE_ENV === "development"
        ? otpMutation.data?.result?.data?.debug_otp
        : undefined;


    const phoneFromResponse = (otpMutation.data as any)?.result?.data?.phone as
      | string
      | undefined;
    const isForgotPassword = purpose === "FORGOT_PASSWORD";
    const displayPhone =
      isForgotPassword && phoneFromResponse ? phoneFromResponse : undefined;
    const displayIdentifier =
      isForgotPassword && displayPhone ? displayPhone : getIdentifier();

    const handleSubmit = (val?: string) => {
      if (val && val !== otpValue) setValue("otp_value" as any, val);
      onOtpVerified();
    };

    return (
      <OtpCustomModal
        open={open}
        onOpenChange={onOpenChange}
        phone={
          displayPhone ||
          (displayIdentifier && !displayIdentifier.includes("@")
            ? displayIdentifier
            : undefined)
        }
        email={
          !displayPhone && displayIdentifier?.includes("@")
            ? displayIdentifier
            : undefined
        }
        identifier={displayIdentifier}
        value={otpValue}
        onChange={(v) => setValue("otp_value" as any, v)}
        isLoading={isLoading}
        isSending={otpMutation.isPending}
        onSubmit={handleSubmit}
        onResend={handleResend}
        resendCooldown={resendCooldown}
        debugOtp={debugOtp}
        title={t("otp.title_phone")}
        subtitle={t("otp.subtitle")}
        verifyText={t("otp.verify")}
        verifyingText={t("otp.verifying")}
        resendText={t("otp.resend")}
        resendInText={t("otp.resend_in")}
        sendingText={t("otp.sending")}
      />
    );
  },
);

OTPModal.displayName = "OTPModal";
