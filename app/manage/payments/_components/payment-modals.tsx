"use client";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import { PaymentForm } from "./payment-form";

export type PaymentModalState = {
  open: boolean;
  paymentId?: string | null;
  isEditing?: boolean;
  isView?: boolean;
};

export type PaymentModalsProps = {
  paymentModal: PaymentModalState;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function PaymentModals({
  paymentModal,
  onOpenChange,
  onSuccess,
}: PaymentModalsProps) {
  return (
    <CustomModal
      open={paymentModal.open}
      onOpenChange={onOpenChange}
      className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
    >
      <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
        {paymentModal.open && (
          <PaymentForm
            paymentId={paymentModal.paymentId}
            isEditing={paymentModal.isEditing}
            isView={paymentModal.isView}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </CustomModalBody>
    </CustomModal>
  );
}
