"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";


import {
  Check,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Menu,
  AlertCircle,
  Upload,
  Loader2,
} from "lucide-react";


export type StepStatus = "pending" | "active" | "done" | "error";

export interface Step {
  id: string;
  label: string;
  shortLabel?: string;
  badge?: string;
  status: StepStatus;
}

export interface FormPageLayoutProps {
  appName?: string;
  formTitle: string;
  steps: Step[];
  activeStep: number;
  onStepChange?: (i: number) => void;
  breadcrumbs?: string[];
  pageTitle: string;
  pageSubtitle?: string;
  footerNote?: string;
  backLabel?: string;
  continueLabel?: string;
  onBack?: () => void;
  onContinue?: () => void;
  isSubmitting?: boolean;
  sidebarExtra?: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  onSidebarExtraClick?: (id: string) => void;
  children: React.ReactNode;
  globalErrors?: string[];
}


function StepIcon({ status, index }: { status: StepStatus; index: number }) {
  const base =
    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] shrink-0";
  if (status === "done")
    return (
      <span className={cn(base, "bg-primary text-primary-foreground")}>
        <Check className="h-3 w-3" />
      </span>
    );
  if (status === "error")
    return (
      <span className={cn(base, "bg-destructive text-destructive-foreground")}>
        <AlertCircle className="h-3 w-3" />
      </span>
    );
  if (status === "active")
    return (
      <span
        className={cn(
          base,
          "border-2 border-primary text-primary font-semibold",
        )}
      >
        {index + 1}
      </span>
    );
  return (
    <span
      className={cn(
        base,
        "border border-muted-foreground/30 text-muted-foreground",
      )}
    >
      {index + 1}
    </span>
  );
}


function SidebarNav({
  steps,
  activeStep,
  onStepChange,
  sidebarExtra,
  onSidebarExtraClick,
  formTitle,
  appName,
  onClose,
}: Pick<
  FormPageLayoutProps,
  | "steps"
  | "activeStep"
  | "onStepChange"
  | "sidebarExtra"
  | "onSidebarExtraClick"
  | "formTitle"
  | "appName"
> & { onClose?: () => void }) {
  const done = steps.filter((s) => s.status === "done").length;
  const progress = Math.round((done / steps.length) * 100);

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="px-4 py-5 border-b">
        {appName && (
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
            {appName}
          </p>
        )}
        <p className="text-sm font-semibold leading-tight">{formTitle}</p>
      </div>

      <ScrollArea className="flex-1 py-3">
        <p className="px-4 pb-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Steps
        </p>
        {steps.map((step, i) => (
          <button
            key={step.id}
            onClick={() => {
              onStepChange?.(i);
              onClose?.();
            }}
            className={cn(
              "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors border-l-2",
              step.status === "active"
                ? "border-primary bg-accent text-accent-foreground font-medium"
                : step.status === "error"
                  ? "border-destructive text-destructive hover:bg-destructive/5"
                  : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <StepIcon status={step.status} index={i} />
            <span className="flex-1 truncate">{step.label}</span>
            {step.badge && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {step.badge}
              </Badge>
            )}
          </button>
        ))}

        {sidebarExtra && sidebarExtra.length > 0 && (
          <>
            <Separator className="my-3 mx-4 w-[calc(100%-2rem)]" />
            <p className="px-4 pb-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              More
            </p>
            {sidebarExtra.map((item) => (
              <button
                key={item.id}
                onClick={() => onSidebarExtraClick?.(item.id)}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border-l-2 border-transparent"
              >
                {item.icon && (
                  <span className="h-4 w-4 flex items-center justify-center">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            ))}
          </>
        )}
      </ScrollArea>

      <div className="px-4 py-3 border-t space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>
            {done} / {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
    </div>
  );
}


export function FormPageLayout({
  appName,
  formTitle,
  steps,
  activeStep,
  onStepChange,
  breadcrumbs,
  pageTitle,
  pageSubtitle,
  footerNote = "All required fields must be filled",
  backLabel = "Back",
  continueLabel = "Save & continue",
  onBack,
  onContinue,
  isSubmitting,
  sidebarExtra,
  onSidebarExtraClick,
  children,
  globalErrors,
}: FormPageLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const navProps = {
    steps,
    activeStep,
    onStepChange,
    sidebarExtra,
    onSidebarExtraClick,
    formTitle,
    appName,
  };

  return (
    <TooltipProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
        {}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r">
          <SidebarNav {...navProps} />
        </aside>

        {}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarNav {...navProps} onClose={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {}
          <header className="flex items-center gap-3 px-5 py-3 border-b bg-card shrink-0">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden h-8 w-8 shrink-0"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
            </Sheet>

            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold truncate">{pageTitle}</h1>
              {pageSubtitle && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {pageSubtitle}
                </p>
              )}
            </div>

            {breadcrumbs && (
              <nav className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                {breadcrumbs.map((b, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <ChevronRight className="h-3 w-3" />}
                    <span
                      className={
                        i === breadcrumbs.length - 1
                          ? "text-foreground font-medium"
                          : ""
                      }
                    >
                      {b}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
            )}

            <Badge variant="secondary" className="md:hidden shrink-0 text-xs">
              {activeStep + 1}/{steps.length}
            </Badge>
          </header>

          {}
          <div className="md:hidden flex gap-1.5 px-4 py-2.5 border-b bg-card overflow-x-auto scrollbar-none shrink-0">
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => onStepChange?.(i)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap border shrink-0 transition-colors",
                  s.status === "active"
                    ? "bg-primary text-primary-foreground border-primary"
                    : s.status === "done"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : s.status === "error"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-muted text-muted-foreground border-border",
                )}
              >
                {s.status === "done" ? (
                  <Check className="h-2.5 w-2.5" />
                ) : s.status === "error" ? (
                  <AlertCircle className="h-2.5 w-2.5" />
                ) : (
                  <span>{i + 1}</span>
                )}
                {s.shortLabel ?? s.label}
              </button>
            ))}
          </div>

          {}
          {globalErrors && globalErrors.length > 0 && (
            <div className="px-5 pt-4 shrink-0">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-0.5 text-sm">
                    {globalErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {}
          <ScrollArea className="flex-1">
            <div className="px-6 py-7 md:px-8 max-w-3xl">{children}</div>
          </ScrollArea>

          {}
          <footer className="flex items-center justify-between gap-3 px-5 py-3 border-t bg-card shrink-0">
            <p className="hidden md:block text-xs text-muted-foreground">
              {footerNote}
            </p>
            <div className="flex gap-2 ml-auto">
              {onBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  {backLabel}
                </Button>
              )}
              <Button size="sm" onClick={onContinue} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                {continueLabel}
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}


export function FieldSection({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                !open && "-rotate-90",
              )}
            />
          </Button>
        </CollapsibleTrigger>
      </div>
      <Separator className="mb-4" />
      <CollapsibleContent className="space-y-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}


export function FieldRow({
  cols = 2,
  children,
}: {
  cols?: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}


export function DynamicList<T extends { id?: string }>({
  label,
  description,
  fields,
  onAdd,
  onRemove,
  addLabel = "Add row",
  minRows = 1,
  children,
}: {
  label: string;
  description?: string;
  fields: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  addLabel?: string;
  minRows?: number;
  children: (field: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="h-7 text-xs gap-1"
        >
          <Plus className="h-3 w-3" />
          {addLabel}
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, i) => (
          <div
            key={field.id ?? i}
            className="flex gap-2 items-start p-3 rounded-lg border bg-muted/30"
          >
            <div className="flex-1 min-w-0">{children(field, i)}</div>
            {fields.length > minRows && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive mt-0.5"
                onClick={() => onRemove(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


export function ConditionalField({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return <>{children}</>;
}


export function FileUploadField({
  label,
  description,
  accept,
  multiple,
  onChange,
  error,
}: {
  label: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (files: FileList | null) => void;
  error?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const handle = (files: FileList | null) => {
    if (!files) return;
    setFileNames(Array.from(files).map((f) => f.name));
    onChange?.(files);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
        onClick={() => ref.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors text-center",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/20",
          error && "border-destructive/50",
        )}
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm font-medium">Drop files or click to upload</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {fileNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 justify-center">
            {fileNames.map((n) => (
              <Badge key={n} variant="secondary" className="text-xs">
                {n}
              </Badge>
            ))}
          </div>
        )}
        <input
          ref={ref}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handle(e.target.files)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
