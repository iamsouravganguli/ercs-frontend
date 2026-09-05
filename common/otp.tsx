"use client";
import { OTPPayload, OTPResponse } from '@/lib/query';
import { CommonsApiServices } from '@/lib/services';
import { ApiResponse } from '@/lib/types';
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";


export const useOtpModal = () => {
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpKey, setOtpKey] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const generateOtpMutation = useMutation<
    ApiResponse<OTPResponse>,
    Error,
    OTPPayload
  >({
    mutationKey: ["OTP_REQUEST"],

    mutationFn: CommonsApiServices.generateOTP,

    onSuccess: (data) => {

      setOtpKey(data.result?.data.otp_key || null);
      setDebugOtp(data.result?.data.debug_otp || null);
      setOtpOpen(true);


      if (
        process.env.NODE_ENV === "development" &&
        data.result?.data?.debug_otp
      ) {
        console.log("DEBUG OTP:", data.result?.data?.debug_otp);
      }
    },

    onError: (error) => {
      console.error("OTP Error:", error);
    },
  });

  const sendOtp = (payload: OTPPayload) => {
    generateOtpMutation.mutate(payload);
  };

  return {
    otpOpen,
    setOtpOpen,
    otpKey,
    debugOtp,
    sendOtp,
    otpLoading: generateOtpMutation.isPending,
  };
};
