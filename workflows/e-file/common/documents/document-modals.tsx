"use client";
import React from "react";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import { Button } from "@/components/ui/button";
import { DocumentForm } from "./document-form";

export function DocumentUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess?: () => void;
}) {
  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      className="w-full max-w-[850px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
    >
      <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
        {open && <DocumentForm onClose={() => onOpenChange(false)} onSuccess={onSuccess} />}
      </CustomModalBody>
    </CustomModal>
  );
}

export function DocumentPreviewModal({
  previewDoc,
  previewUrl,
  onClose,
}: {
  previewDoc: any;
  previewUrl: string;
  onClose: () => void;
}) {
  return (
    <CustomModal
      open={!!previewDoc}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="max-w-none w-screen h-screen p-0 m-0 overflow-hidden bg-white dark:bg-zinc-900 rounded-none border-0 [&>button]:hidden"
    >
      <CustomModalBody className="p-0 m-0 h-full flex flex-col overflow-hidden gap-0">
        <div className="h-14 flex items-center justify-between px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
          <p className="text-sm font-semibold truncate">
            {previewDoc?.type_of_doc || "Document Category"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-4 text-xs font-medium shrink-0"
          >
            Close
          </Button>
        </div>
        <div className="flex-1 min-h-0 bg-zinc-50 dark:bg-zinc-950">
          {previewUrl ? (
            previewUrl.toLowerCase().endsWith(".pdf") ||
            previewDoc?.mime_type?.includes("pdf") ||
            previewUrl.includes(".pdf") ? (
              <iframe
                src={previewUrl}
                title={previewDoc?.file_name || "Document Preview"}
                className="w-full h-full border-0"
              />
            ) : previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <div className="w-full h-full flex items-center justify-center p-0 m-0 overflow-auto">
                {}
                <img
                  src={previewUrl}
                  alt={previewDoc?.file_name || "Document"}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <iframe
                src={previewUrl}
                title={previewDoc?.file_name || "Document Preview"}
                className="w-full h-full border-0"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              No preview available
            </div>
          )}
        </div>
      </CustomModalBody>
    </CustomModal>
  );
}

export function DocumentDeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  docName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
  docName?: string;
}) {
  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-md p-0 overflow-hidden"
    >
      <CustomModalBody className="p-6 space-y-4">
        <h3 className="text-sm font-semibold">Delete Document?</h3>
        <p className="text-xs text-muted-foreground wrap-break-word">
          {docName
            ? `“${docName}” will be permanently deleted.`
            : "This document will be permanently deleted."}{" "}
          This action cannot be undone.
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
