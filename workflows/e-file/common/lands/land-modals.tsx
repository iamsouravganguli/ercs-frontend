"use client";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import { LandForm } from "./land-form";

export type LandModalsProps = {
  landModal: {
    open: boolean;
    landId?: string | null;
    isEditing?: boolean;
    isView?: boolean;
  };
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function LandModals({
  landModal,
  onOpenChange,
  onSuccess,
}: LandModalsProps) {
  return (
    <CustomModal
      open={landModal.open}
      onOpenChange={onOpenChange}
      className="w-full max-w-225 h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
    >
      <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
        {landModal.open && (
          <LandForm
            landId={landModal.landId}
            isEditing={landModal.isEditing}
            isView={landModal.isView}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </CustomModalBody>
    </CustomModal>
  );
}

export function LandDeleteConfirmDialog({
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
        <h3 className="text-sm font-semibold">Delete Land Parcel?</h3>
        <p className="text-xs text-muted-foreground">
          This land record will be permanently removed. This action cannot be
          undone.
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
