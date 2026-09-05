"use client";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PasswordFieldAuth } from "@/components/ui/password-field-auth";
import { useTranslation } from "@/i18n";
import { signupSchema } from "./validation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { SignupService } from "./services";
import { useSearchParams } from "next/navigation";
import { applyBackendErrors } from '@/lib/form-error';
import { withPublicOnlyRoute } from "@/hooks/use-auth-guard";
import { redirectUtil } from "@/utils/redirect";
import { roleSwitch } from "@/utils/role";
import { SignupApiResponse, SignupRequest } from "./types";
import { TextField } from "@/components/ui/text-field";
import { PhoneField } from "@/components/ui/phone-field";
import { EmailField } from "@/components/ui/email-field";
import { RoleSwitchField } from "@/components/ui/role-switch-field";
import { OTPModal, OTPModalHandle } from "@/common/components/otp_modal";
import { CheckboxFieldAuth } from "@/components/ui/checkbox-field-auth";
import { Settings } from "lucide-react";
import toast from "react-hot-toast";
import {
  ProductTour,
  TourStep,
  ProductTourProvider,
} from "@/components/ui/product-tour";
import { SettingsDialogAuth } from "@/components/ui/settings-dialog-auth";

type Role = "ct" | "ad";

function SignupPage() {
  const searchParams = useSearchParams();
  const captchaRefreshRef = useRef<(() => void) | null>(null);
  const otpModalRef = useRef<OTPModalHandle>(null);
  const { t } = useTranslation();

  const [role, setRole] = useState<Role>("ct");
  const isAdvocate = role === "ad";
  const [otpOpen, setOtpOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      password: "",
      confirm_password: "",
      email: "",
      phone: "",
      bar_council_number: "",
      accept_terms: false,
      otp_key: "",
      otp_value: "",
    },
    mode: "onChange",
  });

  const SignupMutation = useMutation({
    mutationKey: ["SIGNUP"],
    mutationFn: SignupService,

    onSuccess: (res: SignupApiResponse) => {
      const data = res.result?.data;
      const destination = redirectUtil.get(
        searchParams,
        roleSwitch(data?.role || role),
      );
      window.location.href = destination;
    },

    onError: (err: SignupApiResponse) => {
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
        captchaRefreshRef.current?.();
        setStep(1);
        return;
      }
      applyBackendErrors(form, err.errors, err.message);
      captchaRefreshRef.current?.();
      setStep(1);
    },
  });

  const onSubmit = useCallback(() => {
    otpModalRef.current?.sendOtp();
  }, []);

  const handleOtpVerified = () => {

    if (role === "ad") {
      const barVal = String(form.getValues("bar_council_number") ?? "").trim();
      if (!barVal) {
        form.setError("bar_council_number", {
          type: "manual",
          message: "bar_council.validation_required",
        });
        setStep(2);
        toast.error(
          t("bar_council.validation_required") ||
            "Bar Council number is required for advocates.",
        );
        return;
      }
    }

    const otp = form.getValues("otp_value");
    if (!otp || otp.length < 6) {
      form.setError("otp_value", { message: "Please enter the 6-digit OTP" });
      return;
    }
    SignupMutation.mutate({ ...form.getValues(), role } as SignupRequest);
  };


  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleNextStep2 = async () => {
    const fieldsToValidate: (keyof z.infer<typeof signupSchema>)[] = [
      "name",
      "phone",
      "email",
    ];
    if (role === "ad") {
      fieldsToValidate.push("bar_council_number");
    }
    const isValid = await form.trigger(fieldsToValidate as any);
    if (!isValid) return;


    if (role === "ad") {
      const barVal = String(form.getValues("bar_council_number") ?? "").trim();
      if (!barVal) {
        form.setError("bar_council_number", {
          type: "manual",
          message: "bar_council.validation_required",
        });
        return;
      }
    }

    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await form.trigger([
      "password",
      "confirm_password",
      "accept_terms",
    ]);
    if (!isValid) return;

    if (!form.getValues("accept_terms")) {
      toast.error(
        t("terms.validation_required") ||
          "Please accept terms of service to continue",
      );
      return;
    }

    void form.handleSubmit(onSubmit)();
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
      targetId: "tour-signup-progress",
      titleKey: "tour.signup_progress.title",
      descriptionKey: "tour.signup_progress.desc",
      defaultTitle: "Sign-Up Progress Tracker",
      defaultDescription:
        "Monitor your registration flow across three easy steps: choosing role, entering details, and setting password.",
      placement: "bottom",
    },
    ...(step === 1
      ? [
          {
            targetId: "tour-signup-role",
            titleKey: "tour.signup_role.title",
            descriptionKey: "tour.signup_role.desc",
            defaultTitle: "Select Account Role",
            defaultDescription:
              "Choose whether you are registering as a Citizen (सामान्य नागरिक) or an Advocate (अधिवक्ता) to gain tailored dashboard access.",
            placement: "top" as const,
          },
        ]
      : []),
    ...(step === 2
      ? [
          {
            targetId: "tour-signup-details",
            titleKey: "tour.signup_details.title",
            descriptionKey: "tour.signup_details.desc",
            defaultTitle: "Fill Personal Details",
            defaultDescription:
              "Enter your Full Name, 10-digit Mobile Number, and registered Email Address. Mobile OTP will be verified before signup.",
            placement: "top" as const,
          },
        ]
      : []),
    ...(step === 3
      ? [
          {
            targetId: "tour-signup-security",
            titleKey: "tour.signup_security.title",
            descriptionKey: "tour.signup_security.desc",
            defaultTitle: "Set Password & Agreement",
            defaultDescription:
              "Choose a strong password, confirm spelling, and accept the terms of service to secure your e-Revenue Courts account.",
            placement: "top" as const,
          },
        ]
      : []),
    {
      targetId: "tour-signup-signin-link",
      titleKey: "tour.signup.title",
      descriptionKey: "tour.signup.desc",
      defaultTitle: "Return to Login Page",
      defaultDescription:
        "Already have an account? Click here to return to the Sign In page.",
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
          id="tour-signup-progress"
          className="w-full sticky top-14 z-30 border-b border-border/40 bg-background"
        >
          <div className="h-1 w-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
            />
          </div>
        </div>

        {}
        <main className="flex flex-1 items-start justify-center px-4 sm:px-6 pt-8 sm:pt-10 pb-12">
          <div className="w-full max-w-[480px]">
            <div className="gap-0 pt-0 pb-0 rounded-xl border-0 bg-transparent shadow-none flex flex-col">
              {}
              <div className="flex flex-col text-left px-0 pt-6 pb-4 select-none">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                  {t("signup.title")}
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
                        handleNextStep1();
                      } else if (step === 2) {
                        void handleNextStep2();
                      } else {
                        void handleFinalSubmit(e);
                      }
                    }}
                  >
                    {step === 1 && (
                      <div
                        id="tour-signup-role"
                        className="space-y-4 animate-in fade-in duration-300"
                      >
                        <RoleSwitchField
                          value={role}
                          label={t("role_switch.label")}
                          citizenText={t("role_switch.citizen")}
                          advocateText={t("role_switch.advocate")}
                          onChange={(val) => {
                            setRole(val);
                            if (val !== "ad") {
                              form.setValue("bar_council_number", "");
                              form.clearErrors("bar_council_number");
                            }
                            captchaRefreshRef.current?.();
                          }}
                        />
                        <Button
                          type="submit"
                          className="w-full h-10 mt-6 cursor-pointer flex items-center justify-center"
                        >
                          {t("tour.next_btn.en") || "Next"}
                        </Button>
                      </div>
                    )}

                    {step === 2 && (
                      <div
                        id="tour-signup-details"
                        className="space-y-4 animate-in fade-in duration-300"
                      >
                        <TextField
                          control={form.control}
                          name="name"
                          required
                          label={t("name.label")}
                          placeholder=""
                        />
                        <PhoneField
                          control={form.control}
                          name="phone"
                          required
                          label={t("phone.label")}
                          placeholder=""
                        />
                        <EmailField
                          control={form.control}
                          name="email"
                          label={t("email.label")}
                          placeholder=""
                        />
                        {isAdvocate && (
                          <TextField
                            control={form.control}
                            name="bar_council_number"
                            required
                            label={t("bar_council.label")}
                            placeholder=""
                          />
                        )}
                        <div className="grid grid-cols-2 gap-3 mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(1)}
                            className="h-10 cursor-pointer border-slate-300 bg-white hover:bg-zinc-50 text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                          >
                            {t("tour.back_btn.en") || "Back"}
                          </Button>
                          <Button type="submit" className="h-10 cursor-pointer">
                            {t("tour.next_btn.en") || "Next"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div
                        id="tour-signup-security"
                        className="space-y-4 animate-in fade-in duration-300"
                      >
                        <PasswordFieldAuth
                          control={form.control}
                          name="password"
                          label={t("password_signup.label")}
                          placeholder=""
                          showStrength
                        />
                        <PasswordFieldAuth
                          control={form.control}
                          name="confirm_password"
                          label={t("password_confirm.label")}
                          placeholder=""
                        />
                        <CheckboxFieldAuth
                          name="accept_terms"
                          control={form.control}
                          label={t("terms.label")}
                          linkText={t("terms.link_text")}
                          linkHref="https://bor.uk.gov.in/website-policies/"
                          linkText2={t("terms.link_text2")}
                          linkHref2="https://bor.uk.gov.in/website-policies/"
                        />
                        <div className="grid grid-cols-2 gap-3 mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(2)}
                            className="h-10 cursor-pointer border-slate-300 bg-white hover:bg-zinc-50 text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                          >
                            {t("tour.back_btn.en") || "Back"}
                          </Button>
                          <Button
                            type="submit"
                            className="h-10 cursor-pointer"
                            disabled={SignupMutation.isPending}
                          >
                            {SignupMutation.isPending
                              ? t("button.signup.pending")
                              : t("button.signup.submit")}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div id="tour-signup-signin-link">
                      <p className="text-center text-sm text-muted-foreground mt-5 mb-2">
                        {t("signup.have_account")}{" "}
                        <Link
                          href="/identity/signin"
                          className="text-primary font-medium hover:underline"
                        >
                          {t("link.signin")}
                        </Link>
                      </p>
                    </div>

                    <OTPModal
                      ref={otpModalRef}
                      open={otpOpen}
                      onOpenChange={setOtpOpen}
                      getIdentifier={() => form.getValues("phone")}
                      purpose="SIGNUP"
                      isLoading={SignupMutation.isPending}
                      onOtpVerified={handleOtpVerified}
                      onCaptchaRefresh={() => captchaRefreshRef.current?.()}
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
            tourId={`signup_page_step_${step}`}
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

export default withPublicOnlyRoute(SignupPage);
