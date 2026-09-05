"use client";

import * as React from "react";
import { Control, FieldValues, Path } from "react-hook-form";

import { FormControl, FormField, FormItem, FormMessage } from "./form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "./input-otp";
import { Button } from "./button";


type OtpPopupProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;

  open: boolean;
  onOpenChange: (open: boolean) => void;

  phone?: string;
  email?: string;

  isLoading?: boolean;

  onSubmit: () => Promise<void> | void;
  onResend?: () => Promise<void> | void;

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


export function OtpPopup<T extends FieldValues>({
  control,
  name,
  open,
  onOpenChange,
  phone,
  email,
  isLoading,
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
}: OtpPopupProps<T>) {
  const [timer, setTimer] = React.useState(resendCooldown);
  const [resendLoading, setResendLoading] = React.useState(false);

  const isEmail = Boolean(email);


  React.useEffect(() => {
    if (!open) return;

    setTimer(resendCooldown);

    const interval = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [open, resendCooldown]);


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

  const sanitizeOtp = (val: string) => val.replace(/\D/g, "").slice(0, 6);

  const maskedValue = isEmail ? maskEmail(email) : maskPhone(phone);

  const resolvedTitle = title ?? (isEmail ? "Verify Email" : "Verify Phone");


  const handleResend = async () => {
    if (!onResend || timer > 0) return;
    setResendLoading(true);
    await onResend();
    setTimer(resendCooldown);
    setResendLoading(false);
  };


  return (
    <Dialog open={Boolean(open)} onOpenChange={onOpenChange}>
      <DialogContent className="p-4">
        {}
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-lg font-semibold">
            {resolvedTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            <span>{subtitle}</span>
            <span className="block font-medium text-foreground mt-1">
              {maskedValue}
            </span>
          </DialogDescription>
        </DialogHeader>

        <FormField
          control={control}
          name={name}
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormControl>
                <InputOTP
                  maxLength={6}
                  value={field.value ?? ""}
                  onChange={(val) => {
                    const clean = sanitizeOtp(val);
                    field.onChange(clean);
                    if (clean.length === 6 && !isLoading) {
                      onSubmit();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = sanitizeOtp(e.clipboardData.getData("text"));
                    field.onChange(pasted);
                  }}
                  containerClassName="justify-center"
                >
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="size-10 text-base font-semibold rounded-xl border bg-muted/30 focus-within:ring-2 focus-within:ring-primary"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {}
        {debugOtp && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-yellow-500/50 bg-yellow-500/5 px-4 py-2">
            <span className="text-xs text-muted-foreground">🔑 OTP:</span>
            <span className="font-mono text-sm font-bold tracking-widest text-yellow-500">
              {debugOtp}
            </span>
          </div>
        )}

        {}
        <Button
          size="lg"
          className="w-full"
          disabled={isLoading}
          onClick={onSubmit}
        >
          {isLoading ? verifyingText : verifyText}
        </Button>

        {}
        <div className="text-center text-sm">
          {timer > 0 ? (
            <span className="text-muted-foreground">
              {resendInText} {timer}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-primary font-medium hover:underline disabled:opacity-50"
            >
              {resendLoading ? sendingText : resendText}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
