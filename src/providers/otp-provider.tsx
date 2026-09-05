"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { OtpCustomModal } from "@/components/ui/otp-custom-modal";
import { CommonsApiServices } from "../lib/services";
import toast from "react-hot-toast";

type OtpRequest = {
  identifier: string;
  purpose: string;
  channel?: string;
  onVerified: (otp_key: string, otp_value: string) => void | Promise<void>;
  title?: string;
  subtitle?: string;
};

type OtpContextValue = {
  requestOtp: (opts: OtpRequest) => void;

  showOtp: (opts: OtpRequest) => void;
};

const OtpContext = React.createContext<OtpContextValue | null>(null);

export function useOtp() {
  const ctx = React.useContext(OtpContext);
  if (!ctx) throw new Error("useOtp must be used within OtpProvider");
  return ctx;
}

export function OtpProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [identifier, setIdentifier] = React.useState("");
  const [purpose, setPurpose] = React.useState("VERIFY_PROFILE_UPDATE");
  const [otpKey, setOtpKey] = React.useState("");
  const [otpValue, setOtpValue] = React.useState("");
  const [title, setTitle] = React.useState<string | undefined>(undefined);
  const [subtitle, setSubtitle] = React.useState<string | undefined>(undefined);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const onVerifiedRef = React.useRef<OtpRequest["onVerified"] | null>(null);
  const [debugOtp, setDebugOtp] = React.useState<string | undefined>(undefined);

  const generateMut = useMutation({
    mutationFn: CommonsApiServices.generateOTP,
    onSuccess: (res: any) => {
      const key = res?.result?.data?.otp_key ?? res?.result?.otp_key ?? "";
      setOtpKey(key);
      setDebugOtp(res?.result?.data?.debug_otp ?? undefined);
      setOpen(true);
      setOtpValue("");
    },
    onError: (err: any) => {
      const msg = err?.message || err?.errors?.otp?.[0] || "Failed to send OTP";
      toast.error(msg);
    },
  });

  const requestOtp = React.useCallback(
    (opts: OtpRequest) => {
      const id = opts.identifier?.trim();
      if (!id) {
        toast.error("Identifier is required");
        return;
      }
      setIdentifier(id);
      setPurpose(opts.purpose);
      setTitle(opts.title);
      setSubtitle(opts.subtitle);
      setOtpValue("");
      setOtpKey("");
      setDebugOtp(undefined);
      onVerifiedRef.current = opts.onVerified;
      generateMut.mutate({
        identifier: id,
        purpose: opts.purpose,
        channel: (opts.channel as any) ?? "SMS",
      } as any);
    },
    [generateMut],
  );

  const handleResend = React.useCallback(() => {
    if (!identifier) return;
    generateMut.mutate({
      identifier,
      purpose,
      channel: "SMS",
    } as any);
  }, [identifier, purpose, generateMut]);

  const handleSubmit = React.useCallback(
    async (val?: string) => {
      const v = (val ?? otpValue).trim();
      if (v.length !== 6) {
        toast.error("Please enter 6-digit OTP");
        return;
      }
      if (!otpKey) {
        toast.error("OTP session expired, please resend");
        return;
      }

      if (val && val !== otpValue) setOtpValue(val);
      setIsVerifying(true);
      try {
        await onVerifiedRef.current?.(otpKey, v);
        setOpen(false);
        setOtpValue("");
        setOtpKey("");
        setDebugOtp(undefined);
      } catch (e: any) {
        setOpen(false);
        setOtpValue("");
        setOtpKey("");
        setDebugOtp(undefined);
        throw e;
      } finally {
        setIsVerifying(false);
      }
    },
    [otpKey, otpValue],
  );

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setOtpValue("");


    }
  };

  return (
    <OtpContext.Provider value={{ requestOtp, showOtp: requestOtp }}>
      {children}
      <OtpCustomModal
        open={open}
        onOpenChange={handleOpenChange}
        identifier={identifier}
        value={otpValue}
        onChange={setOtpValue}
        isLoading={isVerifying}
        isSending={generateMut.isPending}
        onSubmit={handleSubmit}
        onResend={handleResend}
        debugOtp={debugOtp}
        title={title}
        subtitle={subtitle}
      />
    </OtpContext.Provider>
  );
}
