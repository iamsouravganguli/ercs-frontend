import { z } from "zod";

export const BaseMasterSchema = z.object({
  code: z
    .string()
    .min(1, "form.code.validation_required")
    .max(50, "form.code.validation_invalid"),

  name: z
    .string()
    .min(1, "form.name.validation_required")
    .max(255, "form.name.validation_invalid"),

  name_en: z
    .string()
    .max(255, "form.name_en.validation_invalid")
    .nullable()
    .optional(),

  is_active: z.boolean(),

  is_display: z.boolean(),
});
