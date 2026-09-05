import { z } from "zod";

export const ChangePhoneSchema = z.object({
  identifier: z.string().min(1, "identifier.validation_required"),
  otp_key: z.string().optional().or(z.literal("")),
  otp_value: z.string().optional().or(z.literal("")),
});
