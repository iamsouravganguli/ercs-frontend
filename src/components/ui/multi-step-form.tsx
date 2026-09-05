"use client";

import { useState } from "react";
import {
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { type ZodType, type ZodIssue } from "zod";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { cn } from "@/lib/cn";
import { Check, Loader2 } from "lucide-react";


export type StepConfig<TFieldValues extends FieldValues = FieldValues> = {
  id: string;
  label: string;
  description?: string;
  fields: FieldPath<TFieldValues>[];
  schema?: ZodType;
  content: React.ReactNode;
};

export interface MultiStepFormProps<
  TFieldValues extends FieldValues = FieldValues,
> {
  steps: StepConfig<TFieldValues>[];
  title?: string;
  onSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
  onStepSubmit?: (stepId: string, stepIndex: number) => void | Promise<void>;
  labels?: {
    back?: string;
    next?: string;
    submit?: string;
    stepOf?: (current: number, total: number) => string;
  };
}


function SidebarStepButton({
  index,
  label,
  isActive,
  isDone,
  isDisabled,
  onClick,
}: {
  index: number;
  label: string;
  isActive: boolean;
  isDone: boolean;
  isDisabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={isActive ? "secondary" : "ghost"}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full justify-start px-4 py-4 h-auto",
        isActive && "bg-background shadow-sm hover:bg-background",
      )}
    >
      <div
        className={cn(
          "size-8 flex items-center justify-center rounded-full text-sm font-semibold shrink-0 border-2 transition-all",
          isActive
            ? "bg-primary text-primary-foreground border-primary"
            : isDone
              ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700"
              : "bg-muted text-muted-foreground border-border",
        )}
      >
        {isDone ? <Check className="size-4" strokeWidth={2.5} /> : index + 1}
      </div>
      <span
        className={cn(
          "text-sm font-semibold leading-none",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </Button>
  );
}


function MobileStepTab({
  index,
  label,
  isActive,
  isDone,
  isDisabled,
  onClick,
}: {
  index: number;
  label: string;
  isActive: boolean;
  isDone: boolean;
  isDisabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-2 py-4 px-2 rounded-lg transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed",
      )}
    >
      <div
        className={cn(
          "size-10 flex items-center justify-center rounded-full text-sm font-semibold border-2 transition-all",
          isActive
            ? "border-primary bg-primary text-primary-foreground"
            : isDone
              ? "border-green-500 bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400 dark:border-green-500"
              : "border-border bg-card text-muted-foreground",
        )}
      >
        {isDone ? <Check className="size-4" strokeWidth={2.5} /> : index + 1}
      </div>
      <span
        className={cn(
          "text-xs font-semibold leading-none text-center truncate w-full",
          isActive
            ? "text-primary"
            : isDone
              ? "text-green-600 dark:text-green-400"
              : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
}


export function MultiStepForm<TFieldValues extends FieldValues = FieldValues>({
  steps,
  title = "New Entry",
  onSubmit,
  isSubmitting = false,
  onStepSubmit,
  labels,
}: MultiStepFormProps<TFieldValues>) {
  const [current, setCurrent] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [isStepSubmitting, setIsStepSubmitting] = useState(false);

  const methods = useFormContext<TFieldValues>();
  const { trigger, getValues, setError } = methods;

  const isLast = current === steps.length - 1;
  const currentStep = steps[current] as StepConfig<TFieldValues>;
  const isBusy = isStepSubmitting || isSubmitting;

  const l = {
    back: labels?.back ?? "Back",
    next: labels?.next ?? "Next",
    submit: labels?.submit ?? "Submit",
    stepOf: labels?.stepOf ?? ((c: number, t: number) => `Step ${c} of ${t}`),
  };

  const goTo = (i: number) => {
    if (i > maxReached) return;
    setCurrent(i);
  };

  const next = async () => {
    if (isLast) return;


    const valid = await trigger(
      currentStep.fields as FieldPath<TFieldValues>[],
    );
    if (!valid) return;


    if (currentStep.schema) {
      const stepValues = Object.fromEntries(
        currentStep.fields.map((f: FieldPath<TFieldValues>) => [
          f,
          getValues(f),
        ]),
      );
      const result = currentStep.schema.safeParse(stepValues);
      if (!result.success) {
        result.error.issues.forEach((err: ZodIssue) => {
          const field = err.path[0] as FieldPath<TFieldValues>;
          setError(field, { message: err.message });
        });
        return;
      }
    }


    if (onStepSubmit) {
      setIsStepSubmitting(true);
      try {
        await onStepSubmit(currentStep.id, current);
      } catch {
        setIsStepSubmitting(false);
        return;
      }
      setIsStepSubmitting(false);
    }

    const n = current + 1;
    setCurrent(n);
    setMaxReached((p) => Math.max(p, n));
  };

  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-muted">
      {}
      <div className="md:hidden bg-background border-b border-border px-4 py-3 shrink-0">
        <div className="flex w-full">
          {steps.map((step: StepConfig<TFieldValues>, i: number) => (
            <MobileStepTab
              key={step.id}
              index={i}
              label={step.label}
              isActive={current === i}
              isDone={maxReached > i}
              isDisabled={i > maxReached}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>

      {}
      <div className="flex flex-1 min-h-0 md:p-6">
        <Card className="flex flex-1 flex-row min-h-0 w-full rounded-none md:rounded-xl overflow-hidden shadow-sm p-0">
          {}
          <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-muted/60 p-4">
            <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground/60 px-4 mb-4">
              {title}
            </p>
            <div className="flex flex-col gap-1.5">
              {steps.map((step: StepConfig<TFieldValues>, i: number) => (
                <SidebarStepButton
                  key={step.id}
                  index={i}
                  label={step.label}
                  isActive={current === i}
                  isDone={maxReached > i}
                  isDisabled={i > maxReached}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          </aside>

          {}
          <div className="flex flex-1 min-h-0 flex-col bg-card">
            {}
            <CardHeader className="px-6 py-5 border-b border-border rounded-none space-y-1 shrink-0">
              <CardTitle className="text-lg font-semibold text-foreground">
                {currentStep.label}
              </CardTitle>
              {currentStep.description && (
                <CardDescription className="text-sm">
                  {currentStep.description}
                </CardDescription>
              )}
            </CardHeader>

            {}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <CardContent className="p-6">{currentStep.content}</CardContent>
            </div>

            {}
            <div className="shrink-0 border-t border-border bg-card">
              <div className="px-6 py-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {l.stepOf(current + 1, steps.length)}
                </span>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={prev}
                    disabled={current === 0 || isBusy}
                  >
                    {l.back}
                  </Button>
                  {isLast ? (
                    <Button
                      type="button"
                      size="lg"
                      onClick={onSubmit}
                      disabled={isBusy}
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      {l.submit}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="lg"
                      onClick={next}
                      disabled={isBusy}
                    >
                      {isStepSubmitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      {l.next}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
