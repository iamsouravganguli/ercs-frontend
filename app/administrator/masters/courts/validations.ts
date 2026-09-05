import { z } from "zod";
import { BaseMasterSchema } from "../validations";

export const CourtSchema = BaseMasterSchema.extend({
  level: z.coerce.number().int().min(1),
  display_order: z.coerce.number().int().min(1),
});
