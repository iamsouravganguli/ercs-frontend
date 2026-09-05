"use client";

import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalBody,
  CustomModalFooter,
  CustomModalClose,
} from "@/components/ui/custom-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/cn";

import React, { createContext, useContext, useState } from "react";


type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  confirmWord?: string;
  variant?: "default" | "destructive";
};

type ConfirmContextType = {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
};


const ConfirmContext = createContext<ConfirmContextType | null>(null);


export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [inputText, setInputText] = useState("");
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null,
  );

  const { t, lang } = useTranslation();


  const confirm = (opts?: ConfirmOptions): Promise<boolean> => {
    setOptions(opts || {});
    setInputText("");
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };


  const handleClose = (value: boolean) => {
    setOpen(false);
    resolver?.(value);
    setResolver(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) handleClose(false);
    setOpen(newOpen);
  };

  const showCancel = options.showCancel !== false;
  const isHi = lang === "hi";

  const renderInstruction = () => {
    if (!options.confirmWord) return null;
    const key = "common.confirm_word_instruction";
    const rawText = t(key);
    if (rawText === key) {
      return isHi ? (
        <>
          पुष्टि करने के लिए कृपया{" "}
          <span className="font-semibold text-destructive select-all">
            {options.confirmWord}
          </span>{" "}
          टाइप करें:
        </>
      ) : (
        <>
          Please type{" "}
          <span className="font-semibold text-destructive select-all">
            {options.confirmWord}
          </span>{" "}
          to confirm:
        </>
      );
    }
    const parts = rawText.split("{word}");
    return (
      <>
        {parts[0]}
        <span className="font-semibold text-destructive select-all">
          {options.confirmWord}
        </span>
        {parts[1]}
      </>
    );
  };

  const getPlaceholder = () => {
    if (!options.confirmWord) return "";
    const key = "common.confirm_word_placeholder";
    const rawPlaceholder = t(key);
    if (rawPlaceholder === key) {
      return isHi
        ? `${options.confirmWord} टाइप करें`
        : `Type ${options.confirmWord}`;
    }
    return rawPlaceholder.replace("{word}", options.confirmWord);
  };

  const defaultTitle = t("common.are_you_sure");
  const resolvedTitle =
    defaultTitle === "common.are_you_sure"
      ? isHi
        ? "क्या आप आश्वस्त हैं?"
        : "Are you sure?"
      : defaultTitle;

  const defaultDesc = t("common.cannot_be_undone");
  const resolvedDesc =
    defaultDesc === "common.cannot_be_undone"
      ? isHi
        ? "यह क्रिया पूर्ववत नहीं की जा सकती।"
        : "This action cannot be undone."
      : defaultDesc;

  const defaultCancelText = t("common.cancel");
  const resolvedCancelText =
    defaultCancelText === "common.cancel"
      ? isHi
        ? "रद्द करें"
        : "Cancel"
      : defaultCancelText;

  const defaultContinueText = t("common.continue");
  const resolvedContinueText =
    defaultContinueText === "common.continue"
      ? isHi
        ? "आगे बढ़ें"
        : "Continue"
      : defaultContinueText;


  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <CustomModal
        open={open}
        onOpenChange={handleOpenChange}
        className="max-w-100"
      >
        <CustomModalClose onClose={() => handleClose(false)} />
        <CustomModalHeader>
          <CustomModalTitle>{options.title || resolvedTitle}</CustomModalTitle>
          <CustomModalDescription>
            {options.description || resolvedDesc}
          </CustomModalDescription>
        </CustomModalHeader>
        <CustomModalBody className="space-y-3">
          {options.confirmWord && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                {renderInstruction()}
              </p>
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={getPlaceholder()}
                className="h-9 text-sm w-full"
                autoFocus
              />
            </div>
          )}
        </CustomModalBody>
        <CustomModalFooter>
          {showCancel && (
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="flex-1"
            >
              {options.cancelText || resolvedCancelText}
            </Button>
          )}
          <Button
            onClick={() => handleClose(true)}
            variant={
              options.variant === "destructive" ? "destructive" : "default"
            }
            className={cn(
              "flex-1",
              options.variant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
            disabled={
              !!options.confirmWord && inputText !== options.confirmWord
            }
          >
            {options.confirmText || resolvedContinueText}
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </ConfirmContext.Provider>
  );
}


export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }

  return context.confirm;
}
