import { z } from "zod";

export const AddressUpdateSchema = z
  .object({
    mandal_code: z.string().nullable(),
    mandal_name: z.string().nullable(),

    district_code_census: z.string().nullable(),
    district_name: z.string().nullable(),

    tehsil_code_census: z.string().nullable(),
    tehsil_name: z.string().nullable(),

    pargana_code: z.string().nullable(),
    pargana_name: z.string().nullable(),

    ricircle_code: z.string().nullable(),
    ricircle_name: z.string().nullable(),

    rsicircle_code: z.string().nullable(),
    rsicircle_name: z.string().nullable(),

    village_code_census: z.string().nullable(),
    village_name: z.string().nullable(),
    tehsil_name_en: z.string().nullable(),
  })
  .transform((data) => {
    return Object.fromEntries(
      Object.entries(data)
        .filter(
          (entry): entry is [string, string] =>
            entry[1] !== null && entry[1].trim() !== "",
        )
        .map(([k, v]) => [k, v.trim()]),
    );
  });
