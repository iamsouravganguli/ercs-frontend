"use client";

import { useSessionCheck } from "./query";

export type UserRole = "SA" | "PO" | "CO" | "CC" | "AD" | "CT" | "RI" | "RSI";

export function useUserRole() {
  const sessionQuery = useSessionCheck();
  const sessionData = sessionQuery.data?.result?.data;

  const rawRole = (sessionData?.role || "CO").toUpperCase();
  const role = rawRole as UserRole;

  const isCitizen = role === "CT";
  const isAdvocate = role === "AD";
  const isCitizenOrAdvocate =
    role === "CT" || role === "AD" || role === "RI" || role === "RSI";

  const isPeshkar = role === "CO";
  const isSuperAdmin = role === "SA";
  const isJudge = role === "PO" || role === "CO";

  const canCreatePayment =
    role === "CO" || role === "SA" || role === "CC" || role === "PO";

  const canPay = isCitizenOrAdvocate;

  return {
    role,
    sessionData,
    isLoading: sessionQuery.isLoading,
    isCitizen,
    isAdvocate,
    isCitizenOrAdvocate,
    isPeshkar,
    isSuperAdmin,
    isJudge,
    canCreatePayment,
    canPay,
  };
}
