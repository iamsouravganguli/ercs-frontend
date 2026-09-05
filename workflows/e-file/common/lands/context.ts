import { atom } from "jotai";
import * as z from "zod";

export interface LandFormData {
  id: string;
  is_manual?: boolean;
  state_code_census: string | null;
  state_name: string | null;
  mandal_code: string | null;
  mandal_name: string | null;
  district_code_census: string | null;
  district_name: string | null;
  tehsil_code_census: string | null;
  tehsil_name: string | null;
  tehsil_name_en: string | null;
  pargana_code: string | null;
  pargana_name: string | null;
  ricircle_code: string | null;
  rsicircle_code: string | null;
  ricircle_name: string | null;
  rsicircle_name: string | null;
  village_code_census: string | null;
  village_name: string | null;
  khata_number: string | null;
  land_type: string;
  land_type_description: string;
  fasli_year: string;
  land_revenue_payable: string;
  orders: string[];
  remarks: string;
  khasra_no: string;
  plots: string[];
  calculated_area?: number;
  disputed_land?: number;
  total_land_manual?: string;
  owners: {
    name: string;
    father: string;
    address: string;
  }[];
}

export const LandSchema = z
  .object({
    id: z.string(),
    is_manual: z.boolean().optional(),
    state_code_census: z.string().nullable().optional(),
    state_name: z.string().nullable().optional(),
    mandal_code: z.string().nullable().optional(),
    mandal_name: z.string().nullable().optional(),
    district_code_census: z.string().nullable().optional(),
    district_name: z.string().nullable().optional(),
    tehsil_code_census: z.string().nullable().optional(),
    tehsil_name: z.string().nullable().optional(),
    tehsil_name_en: z.string().nullable().optional(),
    pargana_code: z.string().nullable().optional(),
    pargana_name: z.string().nullable().optional(),
    ricircle_code: z.string().nullable().optional(),
    rsicircle_code: z.string().nullable().optional(),
    ricircle_name: z.string().nullable().optional(),
    rsicircle_name: z.string().nullable().optional(),
    village_code_census: z.string().nullable().optional(),
    village_name: z.string().nullable().optional(),
    khata_number: z.string().nullable().optional(),
    land_type: z.string().nullable().optional(),
    land_type_description: z.string().nullable().optional(),
    fasli_year: z.string().nullable().optional(),
    land_revenue_payable: z.string().nullable().optional(),
    orders: z.array(z.string()).optional(),
    remarks: z.string().optional(),
    khasra_no: z.string().nullable().optional(),
    plots: z.array(z.string()).optional(),
    total_land_manual: z.string().nullable().optional(),
    disputed_land: z.preprocess(
      (val) =>
        val === "" || val === null || val === undefined
          ? undefined
          : Number(val),
      z
        .number({
          message: "Disputed land area is required and must be a number",
        })
        .min(0, "Disputed land area must be 0 or more"),
    ),
    owners: z
      .array(
        z.object({
          name: z.string(),
          father: z.string(),
          address: z.string(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {


    const isNewRecord = isNaN(parseInt(String(data.id), 10));
    if (isNewRecord) {
      if (
        !data.state_code_census ||
        String(data.state_code_census).trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "State is required",
          path: ["state_code_census"],
        });
      }
      if (!data.mandal_code || String(data.mandal_code).trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Mandal is required",
          path: ["mandal_code"],
        });
      }
      if (
        !data.district_code_census ||
        String(data.district_code_census).trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "District is required",
          path: ["district_code_census"],
        });
      }
      if (
        !data.tehsil_code_census ||
        String(data.tehsil_code_census).trim().length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Tehsil is required",
          path: ["tehsil_code_census"],
        });
      }
    }
    if (!data.is_manual) {

      if (!data.khata_number || data.khata_number.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Khata number is required",
          path: ["khata_number"],
        });
      }
      if (!data.plots || data.plots.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "At least one plot is required",
          path: ["plots"],
        });
      }
    } else {

      if (!data.khata_number || data.khata_number.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Khata number is required",
          path: ["khata_number"],
        });
      }
      if (!data.khasra_no || data.khasra_no.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Khasra/Plot number is required",
          path: ["khasra_no"],
        });
      }
      if (!data.total_land_manual || Number(data.total_land_manual) <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Total land area is required",
          path: ["total_land_manual"],
        });
      }

      if (!data.owners || data.owners.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "At least one actual owner is required",
          path: ["owners"],
        });
      } else {
        data.owners.forEach((o: any, idx: number) => {
          if (!o.name || String(o.name).trim().length === 0) {
            ctx.addIssue({
              code: "custom",
              message: "Owner name is required",
              path: ["owners", idx, "name"],
            });
          }
        });
      }
    }

    const totalVal = data.is_manual ? Number(data.total_land_manual || 0) : Number((data as any).calculated_area || 0);
    const relatedVal = Number((data as any).disputed_land || 0);
    if (relatedVal > 0 && totalVal > 0 && relatedVal > totalVal) {
      ctx.addIssue({
        code: "custom",
        message: "Related area cannot exceed total area",
        path: ["disputed_land"],
      });
    }
  });

export const landsAtom = atom<LandFormData[]>([]);
export const isDirtyAtom = atom(false);
