"use client";

import * as React from "react";
import { ShieldCheck, Smartphone, Mail } from "lucide-react";

import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalBody,
  CustomModalFooter,
  CustomModalClose,
} from "./custom-modal";
import { SecurityField } from "./security-field";
import { Button } from "./button";


type OtpCustomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  phone?: string;
  email?: string;
  identifier?: string;

  value: string;
  onChange: (val: string) => void;

  isLoading?: boolean;
  isSending?: boolean;

  onSubmit: (val?: string) => void;
  onResend?: () => void;

  resendCooldown?: number;
  debugOtp?: string;

  title?: string;
  subtitle?: string;
  verifyText?: string;
  verifyingText?: string;
  resendText?: string;
  resendInText?: string;
  sendingText?: string;
};

export function OtpCustomModal({
  open,
  onOpenChange,
  phone,
  email,
  identifier,
  value,
  onChange,
  isLoading,
  isSending,
  onSubmit,
  onResend,
  resendCooldown = 30,
  debugOtp,
  title,
  subtitle = "Enter the 6-digit code sent to",
  verifyText = "Verify Code",
  verifyingText = "Verifying...",
  resendText = "Resend Code",
  resendInText = "Resend in",
  sendingText = "Sending...",
}: OtpCustomModalProps) {
  const [timer, setTimer] = React.useState(resendCooldown);

  const resolvedIdentifier = identifier ?? (email ? email : phone);
  const isEmail =
    Boolean(email) ||
    (resolvedIdentifier ? resolvedIdentifier.includes("@") : false);

  React.useEffect(() => {
    if (!open) return;
    setTimer(resendCooldown);
    const interval = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [open, resendCooldown]);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const el = document.querySelector(
        '[data-slot="input-otp"] input',
      ) as HTMLInputElement | null;
      el?.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [open]);

  const maskPhone = (p?: string) => (p ? p.replace(/.(?=.{4})/g, "*") : "");
  const maskEmail = (e?: string) => {
    if (!e) return "";
    const [name, domain] = e.split("@");
    if (!name || !domain) return e;
    const maskedName =
      name.length <= 2
        ? name[0] + "*"
        : name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
    return `${maskedName}@${domain}`;
  };
  const maskedValue = isEmail
    ? maskEmail(email ?? resolvedIdentifier)
    : maskPhone(phone ?? resolvedIdentifier);
  const resolvedTitle = title ?? (isEmail ? "Verify Email" : "Verify Phone");

  const handleResend = async () => {
    if (!onResend || timer > 0) return;
    await onResend();
    setTimer(resendCooldown);
  };

  const handleComplete = (val: string) => {
    if (!isLoading && !isSending) onSubmit(val);
  };

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-[420px] sm:max-w-[440px]"
    >
      <CustomModalClose onClose={() => onOpenChange(false)} />
      <CustomModalHeader className="items-center text-center pb-2">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <CustomModalTitle className="justify-center text-[17px]">
          {resolvedTitle}
        </CustomModalTitle>
        <CustomModalDescription className="text-center">
          <span>{subtitle}</span>
          <span className="mt-1 flex items-center justify-center gap-1.5 font-medium text-foreground">
            {isEmail ? (
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {maskedValue}
          </span>
        </CustomModalDescription>
      </CustomModalHeader>

      <CustomModalBody className="space-y-5 py-5">
        <SecurityField
          value={value}
          onChange={onChange}
          onComplete={handleComplete}
          disabled={isLoading || isSending}
          autoSubmit
          autoFocus={open}
        />

        {debugOtp && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 px-4 py-2.5">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              🔑 OTP:
            </span>
            <span className="font-mono text-sm font-bold tracking-[0.25em] text-amber-600 dark:text-amber-400">
              {debugOtp}
            </span>
          </div>
        )}
      </CustomModalBody>

      <CustomModalFooter className="flex flex-col gap-3 p-4 border-t bg-muted/20">
        <Button
          size="lg"
          className="w-full h-10 text-sm font-semibold rounded-xl shadow-sm"
          disabled={isLoading || isSending || value.length !== 6}
          onClick={() => onSubmit(value)}
        >
          {isLoading ? verifyingText : isSending ? sendingText : verifyText}
        </Button>
        <div className="flex items-center justify-center gap-2 rounded-full border bg-background px-3 py-1.5 shadow-sm">
          <span className="text-xs text-muted-foreground">
            Didn&apos;t receive code?
          </span>
          {timer > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-bold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {resendInText} {timer}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isSending}
              className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSending ? sendingText : resendText}
            </button>
          )}
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          Resend available after {resendCooldown}s • Check SMS
        </p>
      </CustomModalFooter>
    </CustomModal>
  );
}
