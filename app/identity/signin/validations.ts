import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "identifier.validation_required"),

  password: z.string().min(6, "password_signin.validation_required"),

  captcha_key: z.string().uuid(""),

  captcha_value: z
    .string()
    .min(4, "captcha.validation_required")
    .max(10, "captcha.validation_invalid")
    .regex(/^[0-9]+$/, "captcha.validation_invalid"),
});
