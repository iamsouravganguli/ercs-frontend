import { z } from "zod";

export const CourtDetailSchema = z
  .object({
    court_level: z.coerce.number().min(1, "Court level is required"),
    case_nature: z.coerce.number().optional().nullable(),
    appeal_type: z.coerce.number().optional().nullable(),
    court: z.coerce.number().min(1, "Court is required"),
    act: z.coerce.number().min(1, "Act is required"),
    section: z.coerce.number().min(1, "Section is required"),
    state_code_census: z.string(),
    state_name: z.string(),
    mandal_code: z.string().optional().nullable(),
    mandal_name: z.string().optional().nullable(),
    district_code_census: z.string().optional().nullable(),
    district_name: z.string().optional().nullable(),
    tehsil_code_census: z.string().optional().nullable(),
    tehsil_name: z.string().optional().nullable(),
    tehsil_name_en: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {


    const lvl = Number(data.court_level);
    const isMandalLevel = lvl === 2;
    const isDistrictLevel = lvl === 3;
    const isTehsilLevel = lvl === 4 || lvl === 5;
    if (
      (isMandalLevel || isDistrictLevel || isTehsilLevel) &&
      !data.mandal_code
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["mandal_code"],
        message: "Mandal is required",
      });
    }
    if ((isDistrictLevel || isTehsilLevel) && !data.district_code_census) {
      ctx.addIssue({
        code: "custom",
        path: ["district_code_census"],
        message: "District is required",
      });
    }
    if (isTehsilLevel && !data.tehsil_code_census) {
      ctx.addIssue({
        code: "custom",
        path: ["tehsil_code_census"],
        message: "Tehsil is required",
      });
    }
  });
