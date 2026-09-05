import { z } from "zod";

export const ChangePasswordSchema = z
  .object({
    old_password: z.string().min(6, "password_old.validation_required"),
    new_password: z.string().min(6, "password_new.validation_required"),
    confirm_password: z.string().min(1, "password_confirm.validation_required"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ["confirm_password"],
    message: "password_confirm.validation_mismatch",
  });
