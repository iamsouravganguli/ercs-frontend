import { atom } from "jotai";
import * as z from "zod";

export interface PartyFormData {
  id: string;
  party_type_code: string;
  party_nature_code: string;
  full_name: string;
  gender: string;
  life_status: string;
  relation_type: string;
  relation_name: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  contact_pincode: string;
  identity_type: string;
  identity_number: string;
  is_phone_verified: boolean;
  status_code?: string;
}

export const CLAIMANT_PARTY_CODES = [
  "CIT_PLAINTIFF",
  "CIT_APPELLANT",
  "CIT_REVISIONIST",
  "CIT_PETITIONER",
] as const;
export const isClaimantCode = (code?: string | null) =>
  !!code && (CLAIMANT_PARTY_CODES as readonly string[]).includes(code);

export const PartySchema = z
  .object({
    id: z.string(),
    party_type_code: z
      .string({ error: "Please select party type" })
      .min(1, "Please select party type"),
    party_nature_code: z
      .string({ error: "Please select party nature" })
      .min(1, "Please select party nature"),
    full_name: z
      .string({ error: "Please enter full name" })
      .min(1, "Please enter full name"),
    gender: z
      .string({ error: "Please select gender" })
      .min(1, "Please select gender"),
    life_status: z.string().optional().nullable(),
    relation_type: z.string().optional().nullable(),
    relation_name: z.string().optional().nullable(),
    contact_phone: z.string().optional().nullable(),
    contact_email: z.string().optional().nullable(),
    contact_address: z.string().optional().nullable(),
    contact_pincode: z.string().optional().nullable(),
    identity_type: z.string().optional().nullable(),
    identity_number: z.string().optional().nullable(),
    is_phone_verified: z.boolean().default(false),
    status_code: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.party_nature_code === "INDIVIDUAL") {
      if (!data.relation_type) {
        ctx.addIssue({
          code: "custom",
          path: ["relation_type"],
          message: "Please select relation type",
        });
      }
      if (!data.relation_name) {
        ctx.addIssue({
          code: "custom",
          path: ["relation_name"],
          message: "Please enter relation name",
        });
      }
    }

    if (isClaimantCode(data.party_type_code) && !data.contact_phone) {
      ctx.addIssue({
        code: "custom",
        path: ["contact_phone"],
        message: "Phone number is required for claimant",
      });
    }
  });

export const createPartySchema = (t: (key: string) => string) =>
  z
    .object({
      id: z.string(),
      party_type_code: z
        .string({
          error: t("case.parties.form.validation.party_type_required"),
        })
        .min(1, t("case.parties.form.validation.party_type_required")),
      party_nature_code: z
        .string({
          error: t("case.parties.form.validation.party_nature_required"),
        })
        .min(1, t("case.parties.form.validation.party_nature_required")),
      full_name: z
        .string({ error: t("case.parties.form.validation.full_name_required") })
        .min(1, t("case.parties.form.validation.full_name_required")),
      gender: z
        .string({ error: t("case.parties.form.validation.gender_required") })
        .min(1, t("case.parties.form.validation.gender_required")),
      life_status: z.string().optional().nullable(),
      relation_type: z.string().optional().nullable(),
      relation_name: z.string().optional().nullable(),
      contact_phone: z.string().optional().nullable(),
      contact_email: z.string().optional().nullable(),
      contact_address: z.string().optional().nullable(),
      contact_pincode: z.string().optional().nullable(),
      identity_type: z.string().optional().nullable(),
      identity_number: z.string().optional().nullable(),
      is_phone_verified: z.boolean().default(false),
      status_code: z.string().optional().nullable(),
    })
    .superRefine((data, ctx) => {
      if (data.party_nature_code === "INDIVIDUAL") {
        if (!data.relation_type) {
          ctx.addIssue({
            code: "custom",
            path: ["relation_type"],
            message: t("case.parties.form.validation.relation_type_required"),
          });
        }
        if (!data.relation_name) {
          ctx.addIssue({
            code: "custom",
            path: ["relation_name"],
            message: t("case.parties.form.validation.relation_name_required"),
          });
        }
      }
      if (isClaimantCode(data.party_type_code) && !data.contact_phone) {
        ctx.addIssue({
          code: "custom",
          path: ["contact_phone"],
          message: t("case.parties.form.validation.phone_required_claimant"),
        });
      }
    });

export const partiesAtom = atom<PartyFormData[]>([]);
export const isDialogOpenAtom = atom(false);
export const editingIdAtom = atom<string | null>(null);
export const isDirtyAtom = atom(false);
