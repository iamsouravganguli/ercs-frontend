"use client";
import { useState } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { cn } from "@/lib/cn";


type DialogSize = "sm" | "md" | "lg" | "xl" | "full";
type ScrollHeight = "sm" | "md" | "lg" | "xl";

interface DialogStickyFooterProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  size?: DialogSize;

  scrollHeight?: ScrollHeight;

  title?: string;

  description?: string;

  closeLabel?: string;

  children?: React.ReactNode;

  footerActions?: React.ReactNode;

  className?: string;
}


const sizeMap: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-[90vw]",
};

const scrollHeightMap: Record<ScrollHeight, string> = {
  sm: "max-h-[30vh]",
  md: "max-h-[50vh]",
  lg: "max-h-[65vh]",
  xl: "max-h-[80vh]",
};


export function DialogStickyFooter({
  open,
  onOpenChange,
  size = "md",
  scrollHeight = "md",
  title = "Sticky Footer",
  description,
  closeLabel = "Close",
  children,
  footerActions,
  className,
}: DialogStickyFooterProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 p-0 overflow-hidden",
          sizeMap[size],
          className,
        )}
      >
        {}
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {}
        <div
          className={cn(
            "overflow-y-auto no-scrollbar px-6",
            scrollHeightMap[scrollHeight],
          )}
        >
          {children ?? <DefaultContent />}
        </div>

        {}
        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
          {footerActions}
          <DialogClose asChild>
            <Button variant="outline">{closeLabel}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function DefaultContent() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, index) => (
        <p
          key={index}
          className="mb-4 leading-normal text-sm text-muted-foreground"
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
      ))}
    </>
  );
}


export function DialogExamples() {
  const [openSm, setOpenSm] = useState(false);
  const [openMd, setOpenMd] = useState(false);
  const [openLg, setOpenLg] = useState(false);
  const [openXl, setOpenXl] = useState(false);

  return (
    <div className="flex flex-wrap gap-4 p-8">
      {}
      <Button variant="outline" onClick={() => setOpenSm(true)}>
        Small
      </Button>
      <DialogStickyFooter
        open={openSm}
        onOpenChange={setOpenSm}
        size="sm"
        scrollHeight="sm"
        title="Confirm Action"
        description="Are you sure you want to proceed?"
        footerActions={<Button variant="destructive">Delete</Button>}
      />

      {}
      <Button variant="outline" onClick={() => setOpenMd(true)}>
        Medium
      </Button>
      <DialogStickyFooter open={openMd} onOpenChange={setOpenMd} />

      {}
      <Button variant="outline" onClick={() => setOpenLg(true)}>
        Large
      </Button>
      <DialogStickyFooter
        open={openLg}
        onOpenChange={setOpenLg}
        size="lg"
        scrollHeight="lg"
        title="Terms & Conditions"
        description="Please read the following carefully."
        closeLabel="Decline"
        footerActions={<Button>Accept</Button>}
      >
        {Array.from({ length: 15 }).map((_, i) => (
          <p
            key={i}
            className="mb-4 leading-normal text-sm text-muted-foreground"
          >
            Section {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing
            elit. Pellentesque habitant morbi tristique senectus et netus et
            malesuada fames ac turpis egestas.
          </p>
        ))}
      </DialogStickyFooter>

      {}
      <Button variant="outline" onClick={() => setOpenXl(true)}>
        Extra Large
      </Button>
      <DialogStickyFooter
        open={openXl}
        onOpenChange={setOpenXl}
        size="xl"
        scrollHeight="xl"
        title="Preview Document"
        description="Review the document before submitting."
        closeLabel="Cancel"
        footerActions={
          <>
            <Button variant="outline">Save Draft</Button>
            <Button>Submit</Button>
          </>
        }
      />
    </div>
  );
}
