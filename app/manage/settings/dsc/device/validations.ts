import { z } from "zod";

export const dscSchema = z.object({
  device_id: z.coerce.number({ message: "dsc.device_required" }),
  cert_id: z.coerce.number({ message: "dsc.certificate_required" }),
});
