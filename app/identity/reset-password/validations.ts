import { z } from "zod";

export const ResetPasswordSchema = z
  .object({
    identifier: z.string().min(1, "identifier.validation_required"),
    otp_key: z.string().optional().or(z.literal("")),
    otp_value: z.string().optional().or(z.literal("")),
    new_password: z.string().min(6, "password_new.validation_required"),
    confirm_password: z.string("password_confirm.validation_required"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ["confirm_password"],
    message: "password_confirm.validation_mismatch",
  });
