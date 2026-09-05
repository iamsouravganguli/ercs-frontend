"use client";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PasswordFieldAuth } from "@/components/ui/password-field-auth";
import { useTranslation } from "@/i18n";
import { ResetPasswordSchema } from "./validations";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ResetPasswordService } from "./services";
import { useRouter } from "next/navigation";
import { applyBackendErrors } from '@/lib/form-error';
import { withPublicOnlyRoute } from "@/hooks/use-auth-guard";
import { ResetPasswordResponse } from "./types";
import { OTPModal, OTPModalHandle } from "@/common/components/otp_modal";
import { UsernameFieldAuth } from "@/components/ui/username-field-auth";
import { Settings } from "lucide-react";
import toast from "react-hot-toast";
import {
  ProductTour,
  TourStep,
  ProductTourProvider,
} from "@/components/ui/product-tour";
import { SettingsDialogAuth } from "@/components/ui/settings-dialog-auth";

function ResetPasswordPage() {
  const router = useRouter();
  const otpModalRef = useRef<OTPModalHandle>(null);
  const { t } = useTranslation();
  const [otpOpen, setOtpOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      identifier: "",
      new_password: "",
      confirm_password: "",
      otp_key: "",
      otp_value: "",
    },
    mode: "onChange",
  });

  const ResetPasswordMutation = useMutation({
    mutationKey: ["RESET_PASSWORD"],
    mutationFn: ResetPasswordService,

    onSuccess: (res) => {
      toast.success(res.message);
      router.replace("/identity/signin");
    },

    onError: (err: ResetPasswordResponse) => {
      const raw = String(err?.message || JSON.stringify(err?.errors || ""));
      const isInfra =
        raw.includes("6379") ||
        raw.toLowerCase().includes("redis") ||
        raw.includes("Connection refused") ||
        raw.includes("ECONNREFUSED");
      if (isInfra) {
        toast.error(
          t("common_status.something_wrong.description") ||
            "Service is temporarily unavailable. Please try again.",
        );
        setOtpOpen(false);
        setStep(1);
        form.setValue("new_password", "");
        form.setValue("confirm_password", "");
        form.setValue("otp_value", "");
        form.clearErrors("otp_value");
        return;
      }
      applyBackendErrors(form, err.errors, err.message);
      setOtpOpen(false);

      setStep(1);

      form.setValue("new_password", "");
      form.setValue("confirm_password", "");
      form.setValue("otp_value", "");
      form.clearErrors("otp_value");
    },
  });

  const onSubmit = useCallback(() => {
    otpModalRef.current?.sendOtp();
  }, []);

  const handleNext = async () => {
    const valid = await form.trigger(["identifier"]);
    if (valid) setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleOtpVerified = () => {
    const otp = form.getValues("otp_value");
    if (!otp || otp.length < 6) {
      form.setError("otp_value", { message: "Please enter the 6-digit OTP" });
      return;
    }
    ResetPasswordMutation.mutate({ ...form.getValues() });
  };

  const tourSteps: TourStep[] = [
    {
      targetId: "tour-brand",
      titleKey: "tour.brand.title",
      descriptionKey: "tour.brand.desc",
      defaultTitle: "Official Government Branding",
      defaultDescription:
        "This row displays the emblem and official title. The Settings gear opens Preferences to change language or theme.",
      placement: "bottom",
    },
    {
      targetId: "tour-preferences",
      titleKey: "tour.preferences.title",
      descriptionKey: "tour.preferences.desc",
      defaultTitle: "Preferences",
      defaultDescription:
        "Click the Settings gear to switch language between English and Hindi, or toggle Light and Dark modes.",
      placement: "bottom",
    },
    {
      targetId: "tour-reset-progress",
      titleKey: "tour.reset_progress.title",
      descriptionKey: "tour.reset_progress.desc",
      defaultTitle: "Reset Progress",
      defaultDescription:
        "Track your 2-step reset: first verify your identity, then set your new password.",
      placement: "bottom",
    },
    ...(step === 1
      ? [
          {
            targetId: "tour-reset-username",
            titleKey: "tour.username.title",
            descriptionKey: "tour.username.desc",
            defaultTitle: "Enter Username/Identifier",
            defaultDescription:
              "Please type your registered Username, Email Address, or Mobile Number to proceed.",
            placement: "top" as const,
          },
        ]
      : []),
    ...(step === 2
      ? [
          {
            targetId: "tour-reset-new-password",
            titleKey: "tour.reset_new_password.title",
            descriptionKey: "tour.reset_new_password.desc",
            defaultTitle: "Choose Secure New Password",
            defaultDescription:
              "Type a strong new password that combines uppercase, lowercase, numbers, and symbols.",
            placement: "top" as const,
          },
          {
            targetId: "tour-reset-confirm-password",
            titleKey: "tour.reset_confirm_password.title",
            descriptionKey: "tour.reset_confirm_password.desc",
            defaultTitle: "Confirm New Password",
            defaultDescription:
              "Re-type your chosen password to guarantee they match and verify spelling correctness.",
            placement: "top" as const,
          },
        ]
      : []),
    {
      targetId: "tour-reset-signin-link",
      titleKey: "tour.reset_signin_link.title",
      descriptionKey: "tour.reset_signin_link.desc",
      defaultTitle: "Return to Login Page",
      defaultDescription:
        "Already remembered your password? Click here to easily return to the Sign In card instantly.",
      placement: "top",
    },
  ];

  return (
    <ProductTourProvider>
      <div className="min-h-screen flex flex-col bg-white dark:bg-background">
        {}
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              id="tour-brand"
              href="/"
              className="flex items-center gap-3 min-w-0 hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="Logo"
                className="h-9 w-9 object-contain shrink-0"
              />
              <span className="flex flex-col items-start min-w-0">
                <span className="font-bold text-[13.5px] sm:text-sm leading-tight text-foreground font-sans truncate">
                  {t("brand.title") || "Uttarakhand e-Revenue Courts"}
                </span>
                <span className="text-[11px] sm:text-xs text-muted-foreground leading-tight font-medium font-sans truncate">
                  {t("brand.subtitle") || "Board of Revenue, Uttarakhand"}
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                id="tour-preferences"
                variant="ghost"
                size="icon"
                onClick={() => setPreferencesOpen(true)}
                aria-label="Preferences"
                className="h-9 w-9 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 cursor-pointer flex items-center justify-center focus-visible:ring-0 outline-none"
              >
                <Settings className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </div>
        </header>

        {}
        <div
          id="tour-reset-progress"
          className="w-full sticky top-14 z-30 border-b border-border/40 bg-background"
        >
          <div className="h-1 w-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: step === 1 ? "0%" : "100%" }}
            />
          </div>
        </div>

        {}
        <main className="flex flex-1 items-start justify-center px-4 sm:px-6 pt-8 sm:pt-10 pb-12">
          <div className="w-full max-w-[480px]">
            <div className="gap-0 pt-0 pb-0 rounded-xl border-0 bg-transparent shadow-none flex flex-col">
              <div className="flex flex-col text-left px-0 pt-6 pb-4 select-none">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                  {t("reset_password.title")}
                </h1>
              </div>

              <div className="px-1 pt-2 pb-0">
                <Form {...form}>
                  <form
                    autoComplete="off"
                    className="space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (step === 1) {
                        void handleNext();
                      } else {
                        void form.handleSubmit(onSubmit)(e);
                      }
                    }}
                  >
                    {step === 1 && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div id="tour-reset-username">
                          <UsernameFieldAuth
                            control={form.control}
                            name="identifier"
                            label={t("identifier.label")}
                            placeholder=""
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-10 mt-6 cursor-pointer flex items-center justify-center"
                        >
                          {t("tour.next_btn.en") || "Next"}
                        </Button>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div id="tour-reset-new-password">
                          <PasswordFieldAuth
                            control={form.control}
                            name="new_password"
                            label={t("password_new.label")}
                            placeholder=""
                            showStrength
                          />
                        </div>

                        <div id="tour-reset-confirm-password">
                          <PasswordFieldAuth
                            control={form.control}
                            name="confirm_password"
                            label={t("password_confirm.label")}
                            placeholder=""
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBack}
                            className="h-10 cursor-pointer border-slate-300 bg-white hover:bg-zinc-50 text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                          >
                            {t("tour.back_btn.en") || "Back"}
                          </Button>
                          <Button
                            type="submit"
                            className="h-10 cursor-pointer"
                            disabled={ResetPasswordMutation.isPending}
                          >
                            {ResetPasswordMutation.isPending
                              ? t("button.reset_password.pending")
                              : t("button.reset_password.submit")}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div id="tour-reset-signin-link">
                      <p className="text-center text-sm text-muted-foreground mt-5 mb-2">
                        {t("reset_password.have_account.text")}{" "}
                        <Link
                          href="/identity/signin"
                          className="text-primary font-medium hover:underline"
                        >
                          {t("reset_password.have_account.action")}
                        </Link>
                      </p>
                    </div>

                    <OTPModal
                      ref={otpModalRef}
                      open={otpOpen}
                      onOpenChange={setOtpOpen}
                      getIdentifier={() => form.getValues("identifier")}
                      purpose="FORGOT_PASSWORD"
                      isLoading={ResetPasswordMutation.isPending}
                      onOtpVerified={handleOtpVerified}
                    />
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </main>

        {}
        <footer className="mt-auto flex justify-center py-6 border-t border-border/40 bg-white dark:bg-background">
          <ProductTour
            steps={tourSteps}
            tourId={`reset_password_page_step_${step}`}
            autoStartDelay={0}
            triggerClassName="px-4 h-8 text-xs font-semibold rounded-lg bg-card border border-border text-primary hover:bg-muted shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
          />
        </footer>
      </div>

      <SettingsDialogAuth
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </ProductTourProvider>
  );
}

export default withPublicOnlyRoute(ResetPasswordPage);
