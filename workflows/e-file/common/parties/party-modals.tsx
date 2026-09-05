"use client";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import { OtpCustomModal } from "@/components/ui/otp-custom-modal";
import { PartyForm } from "./party-form";
import type { PartyDetail } from "@/lib";

export type PartyModalsProps = {

  partyModal: {
    open: boolean;
    partyId?: string | null;
    isEditing?: boolean;
    isView?: boolean;
  };
  onPartyModalChange: (open: boolean) => void;
  onPartySuccess?: () => void;

  verifyingParty: PartyDetail | null;
  onVerifyingChange: (open: boolean) => void;
  otpValue: string;
  onOtpChange: (v: string) => void;
  isVerifyingOtp: boolean;
  isSendingOtp: boolean;
  onSubmitOtp: () => void;
  onResendOtp: () => void;
  debugOtp?: string;
  t: (k: string) => string;
  otpError?: string;
  otpSuccess?: string;
};

export function PartyModals({
  partyModal,
  onPartyModalChange,
  onPartySuccess,
  verifyingParty,
  onVerifyingChange,
  otpValue,
  onOtpChange,
  isVerifyingOtp,
  isSendingOtp,
  onSubmitOtp,
  onResendOtp,
  debugOtp,
  t,
}: PartyModalsProps) {
  return (
    <>
      <CustomModal
        open={partyModal.open}
        onOpenChange={onPartyModalChange}
        className="w-full max-w-225 h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
      >
        <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
          {partyModal.open && (
            <PartyForm
              partyId={partyModal.partyId}
              isEditing={partyModal.isEditing}
              isView={partyModal.isView}
              onClose={() => onPartyModalChange(false)}
              onSuccess={onPartySuccess}
            />
          )}
        </CustomModalBody>
      </CustomModal>

      <OtpCustomModal
        open={!!verifyingParty}
        onOpenChange={onVerifyingChange}
        phone={verifyingParty?.contact_phone || undefined}
        value={otpValue}
        onChange={(v) => onOtpChange(v.replace(/\D/g, "").slice(0, 6))}
        isLoading={isVerifyingOtp}
        isSending={isSendingOtp}
        onSubmit={onSubmitOtp}
        onResend={onResendOtp}
        debugOtp={debugOtp}
        title={t("otp.title_phone")}
        subtitle={t("otp.subtitle")}
        verifyText={t("otp.verify")}
        verifyingText={t("otp.verifying")}
        resendText={t("otp.resend")}
        resendInText={t("otp.resend_in")}
        sendingText={t("otp.sending")}
      />
    </>
  );
}

export function PartyDeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}) {
  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-md p-0 overflow-hidden"
    >
      <CustomModalBody className="p-6 space-y-4">
        <h3 className="text-sm font-semibold">Delete Party?</h3>
        <p className="text-xs text-muted-foreground">
          This action cannot be undone. The party will be permanently removed.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="h-8 px-4 text-xs font-medium border rounded-md hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="h-8 px-4 text-xs font-semibold bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </CustomModalBody>
    </CustomModal>
  );
}
