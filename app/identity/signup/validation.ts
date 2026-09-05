import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().min(1, "name.validation_required"),

    password: z.string().min(6, "password_signup.validation_required"),
    confirm_password: z.string("password_confirm.validation_required"),

    email: z
      .string("email.validation_required")
      .email("email.validation_invalid")
      .optional()
      .or(z.literal(""))
      .or(z.null()),

    phone: z.string().min(10, "phone.validation_required"),

    bar_council_number: z.string().optional().or(z.literal("")),

    accept_terms: z.boolean(),


    otp_key: z.string().optional().or(z.literal("")),


    otp_value: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ["confirm_password"],
    message: "password_confirm.validation_mismatch",
  });
