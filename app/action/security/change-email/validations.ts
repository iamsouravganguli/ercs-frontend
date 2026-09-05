import { z } from "zod";

export const ChangeEmailSchema = z.object({
  identifier: z.string().min(1, "email_new.validation_required"),
  otp_key: z.string().optional().or(z.literal("")),
  otp_value: z.string().optional().or(z.literal("")),
});
