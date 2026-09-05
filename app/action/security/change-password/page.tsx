"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PasswordFieldAuth } from "@/components/ui/password-field-auth";
import { useTranslation } from "@/i18n";
import { ChangePasswordSchema } from "@/app/action/security/change-password/validations";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ChangePasswordService } from "@/app/action/security/change-password/services";
import { applyBackendErrors } from "@/lib";
import { ChangePasswordResponse } from "@/app/action/security/change-password/types";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

export default function ActionChangePasswordPage() {
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
    mode: "onChange",
  });

  const ChangePasswordMutation = useMutation({
    mutationKey: ["CHANGE_PASSWORD"],
    mutationFn: ChangePasswordService,
    onSuccess: (res) => {
      toast.success(res.message);
      form.reset();
      if (window.opener) {
        window.opener.postMessage("REFRESH_PROFILE", "*");
        window.close();
      }
    },
    onError: (err: ChangePasswordResponse) => {
      applyBackendErrors(form, err.errors, err.message);
    },
  });

  const onSubmit = (data: z.input<typeof ChangePasswordSchema>) => {
    ChangePasswordMutation.mutate(data);
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
                  {t("change_password.title") || "Change Password"}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("change_password.subtitle") ||
                    "Update your account login password"}
                </p>
              </div>
            </div>

            <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <div className="text-base font-semibold pb-2 border-b">
                {t("sections.account_actions") || "Password Configuration"}
              </div>
              <div className="space-y-4">
                <PasswordFieldAuth
                  control={form.control}
                  name="old_password"
                  label={t("password_old.label") || "Current Password"}
                  placeholder={
                    t("password_old.placeholder") || "Enter current password"
                  }
                  autoComplete="current-password"
                />
                <PasswordFieldAuth
                  control={form.control}
                  name="new_password"
                  label={t("password_new.label") || "New Password"}
                  placeholder={
                    t("password_new.placeholder") || "Enter new password"
                  }
                  showStrength
                  autoComplete="new-password"
                />
                <PasswordFieldAuth
                  control={form.control}
                  name="confirm_password"
                  label={t("password_confirm.label") || "Confirm New Password"}
                  placeholder={
                    t("password_confirm.placeholder") || "Confirm new password"
                  }
                  autoComplete="new-password"
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
                disabled={ChangePasswordMutation.isPending}
                onClick={handleCancel}
              >
                {t("common_button.cancel.label") || "Cancel"}
              </Button>
              <Button
                type="submit"
                className="px-6"
                disabled={
                  ChangePasswordMutation.isPending || !form.formState.isValid
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {ChangePasswordMutation.isPending
                  ? t("common_button.saving.label") || "Saving..."
                  : t("common_button.change.label") || "Change"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
