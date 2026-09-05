"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useTranslation } from "@/i18n";
import { ChangeEmailSchema } from "@/app/action/security/change-email/validations";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ChangeEmailService } from "@/app/action/security/change-email/services";
import { applyBackendErrors, useProfileDetail } from "@/lib";
import { ChangeEmailResponse } from "@/app/action/security/change-email/types";
import { OTPModal, OTPModalHandle } from "@/common/components/otp_modal";
import toast from "react-hot-toast";
import { EmailField } from "@/components/ui/email-field";
import { ReadonlyTextField } from "@/components/ui/readonly-text-field";
import { Save } from "lucide-react";

export default function ActionChangeEmailPage() {
  const Profile = useProfileDetail();
  const otpModalRef = useRef<OTPModalHandle>(null);
  const { t } = useTranslation();
  const [otpOpen, setOtpOpen] = useState(false);

  const form = useForm<z.infer<typeof ChangeEmailSchema>>({
    resolver: zodResolver(ChangeEmailSchema),
    defaultValues: {
      identifier: "",
      otp_key: "",
      otp_value: "",
    },
    mode: "onChange",
  });

  const ChangeEmailMutation = useMutation({
    mutationKey: ["CHANGE_EMAIL"],
    mutationFn: ChangeEmailService,
    onSuccess: (res) => {
      toast.success(res.message);
      form.reset();
      if (window.opener) {
        window.opener.postMessage("REFRESH_PROFILE", "*");
        window.close();
      }
    },
    onError: (err: ChangeEmailResponse) => {
      applyBackendErrors(form, err.errors, err.message);
      setOtpOpen(false);
    },
  });

  const onSubmit = (_data: z.input<typeof ChangeEmailSchema>) => {
    otpModalRef.current?.sendOtp();
  };

  const handleOtpVerified = () => {
    const otp = form.getValues("otp_value");
    if (!otp || otp.length < 6) {
      form.setError("otp_value", { message: "Please enter the 6-digit OTP" });
      return;
    }
    ChangeEmailMutation.mutate({ ...form.getValues() });
  };

  const handleCancel = () => {
    form.reset();
    window.close();
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <Form {...form}>
        <form
          autoComplete="off"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  {t("change_email.title") || "Change Email Address"}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("change_email.subtitle") ||
                    "Update your registered email address"}
                </p>
              </div>
            </div>

            <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <div className="text-base font-semibold pb-2 border-b">
                {t("sections.basic_details") || "Email Configuration"}
              </div>
              <div className="space-y-4">
                <ReadonlyTextField
                  label={t("email_old.label") || "Current Email"}
                  value={Profile.data?.result?.data?.email as string}
                />
                <EmailField
                  control={form.control}
                  name="identifier"
                  label={t("email_new.label") || "New Email"}
                  placeholder={t("email_new.placeholder") || "Enter new email"}
                />
              </div>
            </section>
          </div>

          <div className="flex items-center justify-end border-t bg-background px-8 py-4 z-10 relative shrink-0">
            <div className="flex gap-3">
              <Button
                variant="outline"
                type="button"
                className="px-6"
                disabled={ChangeEmailMutation.isPending}
                onClick={handleCancel}
              >
                {t("common_button.cancel.label") || "Cancel"}
              </Button>
              <Button
                type="submit"
                className="px-6"
                disabled={
                  ChangeEmailMutation.isPending || !form.formState.isValid
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {ChangeEmailMutation.isPending
                  ? t("common_button.saving.label") || "Saving..."
                  : t("common_button.change.label") || "Change"}
              </Button>
            </div>
          </div>

          <OTPModal
            ref={otpModalRef}
            open={otpOpen}
            onOpenChange={setOtpOpen}
            getIdentifier={() => Profile.data?.result?.data.phone as string}
            purpose="VERIFY_PROFILE_UPDATE"
            isLoading={ChangeEmailMutation.isPending}
            onOtpVerified={handleOtpVerified}
          />
        </form>
      </Form>
    </div>
  );
}
