"use client";

import { useFormContext } from "react-hook-form";
import { useCaptcha } from '@/lib/query';
import { CaptchaFieldAuth } from "@/components/ui/captcha-field-auth";
import { useTranslation } from "@/i18n";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type LoginForm = {
  captcha_key: string;
  captcha_value: string;
};

type Props = {
  onCaptchaRefreshReady?: (refreshFn: () => void) => void;
};

export const CaptchaField = ({ onCaptchaRefreshReady }: Props) => {
  const { t } = useTranslation();
  const {
    data,
    refetch,
    isError,
    error,
    isLoading: isCaptchaLoading,
  } = useCaptcha() as any;
  const { control, setValue } = useFormContext<LoginForm>();

  useEffect(() => {
    if (!onCaptchaRefreshReady) return;

    onCaptchaRefreshReady(() => {
      setValue("captcha_value", "", {
        shouldValidate: false,
        shouldDirty: false,
      });
      setValue("captcha_key", "", {
        shouldValidate: false,
        shouldDirty: false,
      });
      refetch();
    });
  }, [onCaptchaRefreshReady, refetch, setValue]);


  useEffect(() => {
    const interval = setInterval(() => {
      setValue("captcha_value", "", {
        shouldValidate: false,
        shouldDirty: false,
      });
      setValue("captcha_key", "", {
        shouldValidate: false,
        shouldDirty: false,
      });
      refetch();
    }, 90_000);

    return () => clearInterval(interval);
  }, [refetch, setValue]);

  useEffect(() => {
    if (!data?.result?.data.captcha_key) return;

    setValue("captcha_key", data?.result?.data.captcha_key, {
      shouldValidate: false,
    });
  }, [data?.result?.data.captcha_key, setValue]);


  if (isError) {
    const raw = String((error as any)?.message || "");
    const isInfra =
      raw.includes("6379") ||
      raw.toLowerCase().includes("redis") ||
      raw.includes("Connection refused");
    const friendly = isInfra
      ? "Service is temporarily unavailable. Please tap refresh to retry."
      : (error as any)?.message ||
        "Captcha service is temporarily unavailable. Please tap refresh to retry.";
    return (
      <div className="w-full space-y-2">
        <div className="text-sm font-medium">
          {t("captcha.label")}{" "}
          <span className="ml-0.5 text-destructive">*</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
            <span className="leading-snug">{friendly}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            aria-label="Refresh captcha"
            className="h-9 w-9 shrink-0 rounded-lg border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900/50"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The page will still work — refresh captcha when service recovers.
        </p>
      </div>
    );
  }

  return (
    <CaptchaFieldAuth<LoginForm, "captcha_value">
      control={control}
      name="captcha_value"
      captchaSrc={data?.result?.data.captcha_image as string}
      onRefresh={() => {
        setValue("captcha_value", "");
        setValue("captcha_key", "");
        refetch();
      }}
      label={t("captcha.label")}
      placeholder=""
      containerClassName="w-full"
      debugText={
        process.env.NODE_ENV === "development"
          ? data?.result?.data?.debug_text
          : undefined
      }
    />
  );
};
