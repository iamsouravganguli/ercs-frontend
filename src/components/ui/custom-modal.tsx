"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

type CustomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
};

function CustomModal({
  open,
  onOpenChange,
  children,
  className,
}: CustomModalProps) {


  const [mounted] = React.useState(
    () => typeof document !== "undefined",
  );

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  const tokens = className?.split(/\s+/) ?? [];
  const isFullScreen =
    tokens.includes("w-screen") ||
    tokens.includes("h-screen") ||
    tokens.includes("max-w-none");
  const isMobileFullScreen =
    tokens.includes("max-sm:w-screen") ||
    tokens.includes("max-sm:h-screen") ||
    tokens.includes("max-sm:max-w-none");
  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        isFullScreen ? "p-0" : isMobileFullScreen ? "p-0 sm:p-4" : "p-4",
      )}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-[420px] max-h-[90vh] overflow-hidden rounded-2xl bg-card border border-border shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-200",
          isFullScreen && "max-h-none rounded-none border-0",
          isMobileFullScreen &&
            "max-sm:max-h-none max-sm:rounded-none max-sm:border-0",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function CustomModalHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-6 pb-3", className)}
      {...props}
    />
  );
}

function CustomModalTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "text-base font-semibold leading-none tracking-tight flex items-center gap-2",
        className,
      )}
      {...props}
    />
  );
}

function CustomModalDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

function CustomModalBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("px-6 py-2 flex-1 overflow-y-auto", className)}
      {...props}
    />
  );
}

function CustomModalFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex gap-2 p-4 border-t bg-muted/30 shrink-0 sm:flex-row",
        className,
      )}
      {...props}
    />
  );
}

function CustomModalClose({ onClose }: { onClose: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="absolute top-3 right-3 h-7 w-7 rounded-full"
      onClick={onClose}
      aria-label="Close"
    >
      <X className="h-4 w-4" />
    </Button>
  );
}

export {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalBody,
  CustomModalFooter,
  CustomModalClose,
};
