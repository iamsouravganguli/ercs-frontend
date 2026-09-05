"use client";

import { useProfileDetail, usePasskeyRegisterChallenge, usePasskeyRegisterVerify, usePasskeyDelete, useConfirm, coerceRegistrationOptions, serializeRegistrationResponse } from '@/lib/query';
import { useOtp } from '@/providers/otp-provider';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalBody,
  CustomModalFooter,
  CustomModalClose,
} from "@/components/ui/custom-modal";
import { DataBoundary } from "@/components/ui/data-boundary";
import {
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function MfaPage() {
  const data = useProfileDetail();
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [deviceName, setDeviceName] = useState("");

  const challengeMutation = usePasskeyRegisterChallenge();
  const verifyMutation = usePasskeyRegisterVerify();
  const deleteMut = usePasskeyDelete();
  const confirm = useConfirm();
  const { requestOtp } = useOtp();

  const handleRegisterPasskey = async (customName?: string) => {
    const finalName = (customName ?? deviceName).trim() || "My Passkey";
    setRegisterError(null);
    setRegisterSuccess(null);


    const isSecure = typeof window !== "undefined" ? window.isSecureContext : true;
    const credApi: any =
      typeof navigator !== "undefined" ? (navigator as any).credentials : undefined;
    if (!isSecure) {
      const msg =
        "Passkey needs a secure context (https or localhost). You are on http — open this page via https or localhost to add a passkey.";
      setRegisterError(msg);
      toast.error(msg);
      return;
    }
    if (!credApi?.create) {
      const msg = "Passkey is not supported in this browser. Please use a modern browser (Chrome/Safari) or use OTP.";
      setRegisterError(msg);
      toast.error(msg);
      return;
    }

    try {
      const res = await challengeMutation.mutateAsync();
      if (!res?.result?.data) throw new Error("Failed to generate challenge.");
      const creationOptions = coerceRegistrationOptions(res.result.data);
      const credential = await credApi.create({
        publicKey: creationOptions,
      } as any);
      if (!credential) throw new Error("Cancelled.");
      const payload: any = serializeRegistrationResponse(credential as any);
      payload.device_name = finalName;
      await verifyMutation.mutateAsync(payload);
      const okMsg = `"${finalName}" added`;
      setRegisterSuccess(okMsg);
      toast.success(okMsg);
      setShowNameDialog(false);
      setDeviceName("");
      data.refetch();
    } catch (err: any) {
      const raw = String(err?.message || err?.detail || err || "");

      const isMissingApi =
        raw.includes("Cannot read properties of undefined") && raw.includes("reading 'create'");
      if (isMissingApi) {
        const msg = "Passkey is not supported in this browser. Please use OTP instead.";
        setRegisterError(msg);
        toast.error(msg);
        return;
      }
      const isSecureErr =
        err?.name === "SecurityError" ||
        raw.toLowerCase().includes("secure context") ||
        raw.toLowerCase().includes("not allowed in insecure");
      if (isSecureErr) {
        const msg =
          "Passkey needs a secure context (https or localhost). You are on http — open this page via https or localhost to add a passkey.";
        setRegisterError(msg);
        toast.error(msg);
        return;
      }
      const isNotAllowed =
        err?.name === "NotAllowedError" ||
        raw.includes("timed out or was not allowed") ||
        raw.includes("www.w3.org");

      const friendly = isNotAllowed
        ? "Cancelled or timed out. Try again."
        : raw || "Failed. Try again.";
      setRegisterError(friendly);
      toast.error(friendly);
    }
  };

  const handleNameDialogClose = (open: boolean) => {
    setShowNameDialog(open);
    if (!open) {
      setDeviceName("");
      setRegisterError(null);
      setRegisterSuccess(null);
    }
  };

  const isPending =
    challengeMutation.isPending ||
    verifyMutation.isPending ||
    deleteMut.isPending;

  const handleDeletePasskey = async (pk: any) => {
    const confirmed = await confirm({
      title: "Delete Passkey?",
      description: `Remove "${pk.device_name}"? OTP verification is mandatory.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    const phone = (data.data?.result?.data as any)?.phone || "";
    if (!phone) {
      toast.error("Registered phone not found for OTP");
      return;
    }
    requestOtp({
      identifier: phone,
      purpose: "VERIFY_PROFILE_UPDATE",
      onVerified: async (otp_key, otp_value) => {
        try {
          await deleteMut.mutateAsync({
            passkey_id: pk.id,
            otp_key,
            otp_value,
          });
          toast.success("Passkey deleted successfully");
          data.refetch();
        } catch (e: any) {
          const msg =
            e?.message ||
            e?.errors?.otp_value?.[0] ||
            e?.errors?.passkey_id?.[0] ||
            "Failed to delete passkey";
          toast.error(msg);
          throw e;
        }
      },
    });
  };
  const profileData: any = data.data?.result?.data;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
      <div className="shrink-0 h-14 flex items-center justify-between gap-4 px-6 bg-white dark:bg-background sticky top-0 z-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Passkeys
        </h2>
        <Button
          size="sm"
          onClick={() => setShowNameDialog(true)}
          disabled={isPending}
          className="h-8 px-3 shrink-0"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 bg-white dark:bg-background">
        <DataBoundary
          isError={data.isError}
          data={profileData}
          errorTitle="Something went wrong"
          errorMessage={
            (data.error as any)?.response?.data?.message || "Failed to load"
          }
          onRefetch={data.refetch}
          emptyTitle="No data"
          emptyMessage="No data"
          refetchLabel="Retry"
        >
          <div className="w-full space-y-5">
            <Card className="p-4 sm:p-5 flex flex-col gap-5 border-0 shadow-sm bg-white dark:bg-card rounded-xl">
              <div className="space-y-1">
                <p className="text-base font-semibold leading-none text-foreground">
                  MFA {profileData?.has_mfa ? "• Enabled" : "• Not enabled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profileData?.passkeys?.length || 0} passkey(s)
                </p>
              </div>

              {registerSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs">
                  <ShieldCheck className="h-4 w-4 shrink-0" /> {registerSuccess}
                </div>
              )}
              {registerError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-destructive/15 bg-destructive/10 dark:bg-destructive/15 text-destructive dark:text-red-400 text-xs">
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {registerError}
                </div>
              )}

              {profileData?.passkeys?.length > 0 ? (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-card">
                  {profileData.passkeys.map((pk: any) => (
                    <div
                      key={pk.id}
                      className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Fingerprint className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-foreground">
                            {pk.device_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {new Date(pk.created_at).toLocaleDateString(
                              undefined,
                              { dateStyle: "medium" },
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                        onClick={() => handleDeletePasskey(pk)}
                        disabled={deleteMut.isPending}
                        title="Delete passkey"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3 sm:py-2 border border-dashed border-border dark:border-border rounded-xl bg-card/50 dark:bg-card/30">
                  No passkeys yet — add one to enable MFA.
                </p>
              )}
            </Card>

            <CustomModal
              open={showNameDialog}
              onOpenChange={handleNameDialogClose}
            >
              <CustomModalClose onClose={() => handleNameDialogClose(false)} />
              <CustomModalHeader>
                <CustomModalTitle>Name passkey</CustomModalTitle>
                <CustomModalDescription>
                  e.g., My iPhone or Office Laptop
                </CustomModalDescription>
              </CustomModalHeader>
              <CustomModalBody className="space-y-4 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="deviceName" className="text-sm font-medium">
                    Device Name
                  </Label>
                  <Input
                    id="deviceName"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="My iPhone 15"
                    maxLength={40}
                    autoFocus
                    className="h-9 text-[15px] px-2.5"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isPending) {
                        e.preventDefault();
                        void handleRegisterPasskey();
                      }
                    }}
                  />
                </div>
              </CustomModalBody>
              <CustomModalFooter>
                <Button
                  variant="outline"
                  onClick={() => handleNameDialogClose(false)}
                  disabled={isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleRegisterPasskey()}
                  disabled={isPending}
                  className="flex-1"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </CustomModalFooter>
            </CustomModal>
          </div>
        </DataBoundary>
      </div>
    </div>
  );
}
