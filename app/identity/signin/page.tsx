"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { UsernameFieldAuth } from "@/components/ui/username-field-auth";
import { PasswordFieldAuth } from "@/components/ui/password-field-auth";
import { CaptchaField } from "@/common/components/captcha";
import { useTranslation } from "@/i18n";
import { loginSchema } from "./validations";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { SigninService } from "./services";
import { useSearchParams } from "next/navigation";
import { redirectUtil } from "@/utils/redirect";
import { applyBackendErrors } from '@/lib/form-error';
import { coerceAuthenticationOptions, serializeAssertionResponse, usePasskeySigninVerify, useMfaOtpVerify } from '@/lib/query';
import { useOtp } from '@/providers/otp-provider';
import { withPublicOnlyRoute } from "@/hooks/use-auth-guard";
import { SigninApiResponse } from "./types";
import { roleSwitch } from "@/utils/role";
import {
  Settings,
  Fingerprint,
  ShieldAlert,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import {
  ProductTour,
  TourStep,
  ProductTourProvider,
} from "@/components/ui/product-tour";
import { SettingsDialogAuth } from "@/components/ui/settings-dialog-auth";

function SigninPage() {
  const captchaRefreshRef = useRef<(() => void) | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [step, setStep] = useState(1);
  const searchParams = useSearchParams();
  const redirectPath = redirectUtil.get(searchParams, "/dashboard");
  const { t } = useTranslation();
  console.log(redirectPath);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      captcha_key: "",
      captcha_value: "",
    },
    mode: "onChange",
  });

  const [mfaOpen, setMfaOpen] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaChallenge, setMfaChallenge] = useState<any>(null);
  const [mfaPhone, setMfaPhone] = useState<string | null>(null);

  const signinVerifyMutation = usePasskeySigninVerify();
  const mfaOtpVerifyMutation = useMfaOtpVerify();
  const { requestOtp } = useOtp();

  const triggerMfaAssertion = async (optionsData: any) => {
    setMfaError(null);
    setMfaChallenge(optionsData);
    setMfaPhone(optionsData?.phone || null);
    setMfaOpen(true);


    const credApi: any =
      typeof navigator !== "undefined" ? (navigator as any).credentials : undefined;
    const isSecure = typeof window !== "undefined" ? window.isSecureContext : true;
    if (!credApi?.get || !isSecure) {
      const msg =
        !isSecure
          ? "Passkey needs a secure context (https or localhost). Please use OTP."
          : "Passkey is not supported in this browser. Please use OTP instead.";
      console.warn("[MFA] WebAuthn not available:", { hasCredApi: !!credApi?.get, isSecure });
      setMfaError(msg);
      return;
    }

    try {
      const assertionOptions = coerceAuthenticationOptions(optionsData);
      const assertion = await credApi.get({
        publicKey: assertionOptions,
      } as any);
      if (!assertion) throw new Error("No credential was returned.");
      const payload = serializeAssertionResponse(assertion as any);
      const verifyRes: any = await signinVerifyMutation.mutateAsync(payload);
      toast.success(t("mfa.success") || "MFA authentication successful!");
      const verifiedData = verifyRes.result?.data;
      const destination = redirectUtil.get(
        searchParams,
        roleSwitch(verifiedData?.role || ""),
      );
      window.location.href = destination;
    } catch (err: any) {

      const raw = String(err?.message || err?.detail || err || "");
      const isMissingApi =
        raw.includes("Cannot read properties of undefined") && raw.includes("reading 'get'");
      if (isMissingApi) {
        setMfaError("Passkey is not supported in this browser. Please use OTP instead.");
        return;
      }
      console.error("Passkey assertion failed:", err);
      const isNotAllowed =
        err?.name === "NotAllowedError" ||
        raw.includes("timed out or was not allowed") ||
        raw.includes("www.w3.org");
      const friendly = isNotAllowed
        ? t("mfa.error_cancelled") ||
          "Passkey was cancelled or timed out. Please try again."
        : raw ||
          t("mfa.error_generic") ||
          "Authentication failed. Please try again.";
      setMfaError(friendly);
    }
  };

  const handleMfaOtp = () => {
    const phone = mfaPhone || form.getValues("identifier")?.trim();
    if (!phone) {
      toast.error("Registered phone not found");
      return;
    }
    requestOtp({
      identifier: phone,
      purpose: "VERIFY_MFA",
      onVerified: async (otp_key, otp_value) => {
        try {
          const verifyRes: any = await mfaOtpVerifyMutation.mutateAsync({
            otp_key,
            otp_value,
          });
          toast.success(
            verifyRes?.message || t("mfa.success") || "MFA verified",
          );
          const verifiedData = verifyRes.result?.data;
          const destination = redirectUtil.get(
            searchParams,
            roleSwitch(verifiedData?.role || ""),
          );
          window.location.href = destination;
        } catch (err: any) {
          const msg =
            err?.message ||
            err?.errors?.otp_value?.[0] ||
            err?.errors?.detail ||
            "OTP verification failed";
          setMfaError(msg);
          toast.error(msg);
          throw err;
        }
      },
    });
  };

  const SigninMutation = useMutation({
    mutationKey: ["LOGIN"],
    mutationFn: SigninService,

    onSuccess: (res: SigninApiResponse) => {
      const data = res.result?.data;
      if (data?.mfa_required) {

        triggerMfaAssertion(data);
        return;
      }
      const destination = redirectUtil.get(
        searchParams,
        roleSwitch(data?.role || ""),
      );
      window.location.href = destination;
    },

    onError: (err: SigninApiResponse) => {
      let errorMsg =
        err?.message ||
        (err?.errors?.detail
          ? Array.isArray(err.errors.detail)
            ? err.errors.detail[0]
            : err.errors.detail
          : undefined) ||
        "Failed to sign in";


      const raw = String(errorMsg);
      const isInfraError =
        raw.includes("6379") ||
        raw.includes("Connection refused") ||
        raw.toLowerCase().includes("redis") ||
        raw.includes("ECONNREFUSED");
      if (isInfraError) {
        errorMsg =
          t("common_status.something_wrong.description") ||
          "Service is temporarily unavailable. Please try again in a moment.";
      }

      toast.error(errorMsg);
      applyBackendErrors(form, err.errors, err.message);


      setStep(1);


      captchaRefreshRef.current?.();

      form.clearErrors("captcha_value");
      form.clearErrors("captcha_key");
    },
  });

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
      targetId: "tour-signin-progress",
      titleKey: "tour.signin_progress.title",
      descriptionKey: "tour.signin_progress.desc",
      defaultTitle: "Sign-In Progress",
      defaultDescription:
        "Track your 2-step login: first enter account credentials, then verify captcha to securely sign in.",
      placement: "bottom",
    },
    ...(step === 1
      ? [
          {
            targetId: "tour-username",
            titleKey: "tour.username.title",
            descriptionKey: "tour.username.desc",
            defaultTitle: "Enter Username/Identifier",
            defaultDescription:
              "Please type your registered Username, Email Address, or Mobile Number to proceed.",
            placement: "top" as const,
          },
          {
            targetId: "tour-password",
            titleKey: "tour.password.title",
            descriptionKey: "tour.password.desc",
            defaultTitle: "Security Password",
            defaultDescription:
              "Enter your confidential login password. Do not share your password with anyone.",
            placement: "top" as const,
          },
        ]
      : []),
    ...(step === 2
      ? [
          {
            targetId: "tour-captcha",
            titleKey: "tour.captcha.title",
            descriptionKey: "tour.captcha.desc",
            defaultTitle: "Secure Captcha Validation",
            defaultDescription:
              "Type the numeric-digits captcha code shown in the image to prevent automated bot access.",
            placement: "top" as const,
          },
        ]
      : []),
    {
      targetId: "tour-signup",
      titleKey: "tour.signup.title",
      descriptionKey: "tour.signup.desc",
      defaultTitle: "Register / Create Account",
      defaultDescription:
        "New to the portal? Click here to register your citizen or advocate account instantly.",
      placement: "top",
    },
  ];

  const onSubmit = (data: z.input<typeof loginSchema>) => {
    SigninMutation.mutate(data);
  };

  const handleNext = async () => {
    const valid = await form.trigger(["identifier", "password"]);
    if (valid) setStep(2);
  };

  const handleBack = () => setStep(1);

  return (
    <ProductTourProvider>
      <div className="min-h-screen flex flex-col bg-white dark:bg-background">
        {}
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {}
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

            {}
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
          id="tour-signin-progress"
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
        <main className="flex flex-1 items-start justify-center px-4 sm:px-6 pt-8 sm:pt-12 pb-12">
          <div className="w-full max-w-[480px]">
            <div className="gap-0 pt-0 pb-0 rounded-xl border-0 bg-transparent shadow-none flex flex-col">
              {}
              <div className="flex flex-col text-left px-0 pt-6 pb-4 select-none">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                  {t("signin.title")}
                </h1>
              </div>

              <div className="px-1 pt-2 pb-0">
                <Form {...form}>
                  <form
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
                        <div id="tour-username">
                          <UsernameFieldAuth
                            control={form.control}
                            name="identifier"
                            label={t("identifier.label")}
                            placeholder=""
                          />
                        </div>

                        <div id="tour-password">
                          <PasswordFieldAuth
                            control={form.control}
                            name="password"
                            label={t("password_signin.label")}
                            placeholder=""
                            showForgotPassword
                            forgotPasswordText={t("link.forgot_password")}
                            forgotPasswordHref="/identity/reset-password"
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
                        <div id="tour-captcha">
                          <CaptchaField
                            onCaptchaRefreshReady={(fn) => {
                              captchaRefreshRef.current = fn;
                            }}
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
                            disabled={SigninMutation.isPending}
                          >
                            {SigninMutation.isPending
                              ? t("button.signin.pending")
                              : t("button.signin.submit")}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div id="tour-signup">
                      <p className="text-center text-sm text-muted-foreground mt-5 mb-2">
                        {t("signin.no_account.text")}{" "}
                        <Link
                          href="/identity/signup"
                          className="text-primary font-medium hover:underline"
                        >
                          {t("link.signup")}
                        </Link>
                      </p>
                    </div>
                  </form>
                </Form>
              </div>

              {}
            </div>
          </div>
        </main>

        {}
        <footer className="mt-auto flex justify-center py-6 border-t border-border/40 bg-white dark:bg-background">
          <ProductTour
            steps={tourSteps}
            tourId={`signin_page_step_${step}`}
            autoStartDelay={0}
            triggerClassName="px-4 h-8 text-xs font-semibold rounded-lg bg-card border border-border text-primary hover:bg-muted shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
          />
        </footer>
      </div>

      <SettingsDialogAuth
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />

      {}
      <CustomModal
        open={mfaOpen}
        onOpenChange={(open) => {
          if (
            !signinVerifyMutation.isPending &&
            !mfaOtpVerifyMutation.isPending
          )
            setMfaOpen(open);
        }}
      >
        <CustomModalHeader className="items-center text-center pb-2">
          <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-1">
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse [animation-duration:2.5s]" />
            <Fingerprint className="h-8 w-8 relative z-10" />
          </div>
          <CustomModalTitle className="justify-center text-center">
            {t("mfa.title") || "Multi-Factor Authentication"}
          </CustomModalTitle>
          <CustomModalDescription className="text-center max-w-[300px] mx-auto">
            {t("mfa.description") ||
              "Confirm your identity using your registered Passkey (Windows Hello, FaceID, TouchID, or security key)."}
          </CustomModalDescription>
        </CustomModalHeader>
        <CustomModalBody className="space-y-3 pt-1">
          {signinVerifyMutation.isPending && (
            <div className="flex flex-col items-center justify-center gap-3 py-4">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <p className="text-xs font-medium text-muted-foreground">
                {t("mfa.verifying") || "Verifying signature…"}
              </p>
            </div>
          )}
          {mfaError && (
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-destructive/15 bg-destructive/10 dark:bg-destructive/15 text-destructive dark:text-red-400 text-xs">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <p className="font-medium text-center leading-snug">{mfaError}</p>
            </div>
          )}
          {!signinVerifyMutation.isPending &&
            !mfaOtpVerifyMutation.isPending && (
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full h-10 font-medium gap-2"
                  onClick={() => triggerMfaAssertion(mfaChallenge)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {t("mfa.verify_btn") || "Verify with Passkey"}
                </Button>
                <div className="flex items-center gap-2 py-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button
                  variant="outline"
                  className="w-full h-10 font-medium gap-2"
                  onClick={handleMfaOtp}
                  disabled={mfaOtpVerifyMutation.isPending}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Use OTP instead
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-8 text-xs"
                  onClick={() => setMfaOpen(false)}
                >
                  {t("mfa.cancel") || "Cancel"}
                </Button>
              </div>
            )}
          {(signinVerifyMutation.isPending || mfaOtpVerifyMutation.isPending) &&
            mfaOtpVerifyMutation.isPending && (
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
                <p className="text-xs font-medium text-muted-foreground">
                  Verifying OTP…
                </p>
              </div>
            )}
        </CustomModalBody>
      </CustomModal>
    </ProductTourProvider>
  );
}

export default withPublicOnlyRoute(SigninPage);
