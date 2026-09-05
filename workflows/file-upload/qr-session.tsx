"use client";
import { useDocQRSessionCreate, useDocQRSessionDetail } from "@/lib";
export function useQRSession(token?: string) {
  return useDocQRSessionDetail(token || "", !!token);
}
export function useVerifyQR(token?: string) {
  return useDocQRSessionDetail(token || "", !!token);
}
export function useCreateQR() {
  return useDocQRSessionCreate();
}
