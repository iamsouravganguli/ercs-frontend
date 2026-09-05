import z from "zod";
import { BaseMasterSchema } from "../validations";

export const RoleSchema = BaseMasterSchema.extend({
  permissions: z.array(z.number().int().positive()),
});

export const PermissionSchema = BaseMasterSchema.extend({
  value: z
    .string()
    .min(1, "form.value.validation_required")
    .max(100, "form.value.validation_invalid")
    .regex(/^[a-z0-9_]+$/, "form.value.validation_invalid"),

  description: z
    .string()
    .max(500, "form.description.validation_invalid")
    .nullable()
    .optional(),

  ui_path: z
    .string()
    .max(255, "form.ui_path.validation_invalid")
    .nullable()
    .optional()
    .or(z.literal("")),

  match_type: z.enum(["PURE", "QUERY", "REGEX", "NONE"]).default("NONE"),
});

export const UserCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  employee_id: z.string().optional().or(z.literal("")),
  gender: z.number().int().positive("Gender is required").optional().nullable(),
  role: z.number().int().positive("Role is required"),
  court: z.number().int().positive().nullable().optional(),
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.length >= 8,
      "Password must be at least 8 characters",
    ),
});

export const CourtUserCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  employee_id: z.string().optional().or(z.literal("")),
  gender: z.number().int().positive("Gender is required").optional().nullable(),
  role: z.number().int().positive("Role is required"),
  court_level: z.union([z.string(), z.number()]).optional().nullable(),
  court: z.number().int().positive().optional().nullable(),
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.length >= 8,
      "Password must be at least 8 characters",
    ),

  state_code_census: z.string().optional().nullable(),
  state_name: z.string().optional().nullable(),
  state_name_en: z.string().optional().nullable(),

  mandal_code: z.string().optional().nullable(),
  mandal_name: z.string().optional().nullable(),
  mandal_name_en: z.string().optional().nullable(),

  district_code_census: z.string().optional().nullable(),
  district_name: z.string().optional().nullable(),
  district_name_en: z.string().optional().nullable(),

  tehsil_code_census: z.string().optional().nullable(),
  tehsil_name: z.string().optional().nullable(),
  tehsil_name_en: z.string().optional().nullable(),

  pargana_code_census: z.string().optional().nullable(),
  pargana_name: z.string().optional().nullable(),
  pargana_name_en: z.string().optional().nullable(),

  ricircle_code: z.string().optional().nullable(),
  ricircle_name: z.string().optional().nullable(),
  ricircle_name_en: z.string().optional().nullable(),

  rsicircle_code: z.string().optional().nullable(),
  rsicircle_name: z.string().optional().nullable(),
  rsicircle_name_en: z.string().optional().nullable(),

  village_code_census: z.string().optional().nullable(),
  village_name: z.string().optional().nullable(),
  village_name_en: z.string().optional().nullable(),

  villages: z.array(z.string()).optional().default([]),
});

export const CitizenSchema = z.object({
  is_active: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  role: z.any().optional().nullable(),
});


export const SystemUserSchema = UserCreateSchema.omit({
  password: true,
}).extend({
  is_active: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});

export const CourtUserSchema = CourtUserCreateSchema.omit({
  password: true,
}).extend({
  is_active: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});


export const SystemUserAddSchema = UserCreateSchema.extend({
  is_active: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});

export const CourtUserAddSchema = CourtUserCreateSchema.extend({
  is_active: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});
