import { z } from "zod";

export const SupportTypeSchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  name: z.string().min(1, "Name (Hindi) is required"),
  name_en: z.string().min(1, "Name (English) is required"),
  roles: z.array(z.coerce.number()).optional().default([]),
  display_order: z.coerce.number().min(1, "Display order must be >= 1"),
  is_active: z.boolean().default(true),
  is_display: z.boolean().default(true),
});

export const CategorySchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  name: z.string().min(1, "Name (Hindi) is required"),
  name_en: z.string().min(1, "Name (English) is required"),
  display_order: z.coerce.number().min(1, "Display order must be >= 1"),
  is_active: z.boolean().default(true),
  is_display: z.boolean().default(true),
});

export const SubCategorySchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  name: z.string().min(1, "Name (Hindi) is required"),
  name_en: z.string().min(1, "Name (English) is required"),
  category: z.coerce.number().min(1, "Parent Category is required"),
  display_order: z.coerce.number().min(1, "Display order must be >= 1"),
  is_active: z.boolean().default(true),
  is_display: z.boolean().default(true),
});

export const PrioritySchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  name: z.string().min(1, "Name (Hindi) is required"),
  name_en: z.string().min(1, "Name (English) is required"),
  color_code: z.string().min(1, "Color code is required"),
  response_time_hours: z.coerce.number().min(1, "Must be at least 1"),
  response_time_unit: z.string().default("hours"),
  resolution_time_hours: z.coerce.number().min(1, "Must be at least 1"),
  resolution_time_unit: z.string().default("hours"),
  display_order: z.coerce.number().min(1, "Display order must be >= 1"),
  is_active: z.boolean().default(true),
  is_display: z.boolean().default(true),
});

export const StatusSchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  name: z.string().min(1, "Name (Hindi) is required"),
  name_en: z.string().min(1, "Name (English) is required"),
  color_code: z.string().min(1, "Color code is required"),
  is_initial: z.boolean().default(false),
  is_terminal: z.boolean().default(false),
  display_order: z.coerce.number().min(1, "Display order must be >= 1"),
  is_active: z.boolean().default(true),
  is_display: z.boolean().default(true),
});

export const EscalationLevelSchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  name: z.string().min(1, "Name (Hindi) is required"),
  name_en: z.string().min(1, "Name (English) is required"),
  level_number: z.coerce.number().min(1).max(4),
  display_order: z.coerce.number().min(1, "Display order must be >= 1"),
  is_active: z.boolean().default(true),
  is_display: z.boolean().default(true),
});

export const ResolutionTypeSchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  name: z.string().min(1, "Name (Hindi) is required"),
  name_en: z.string().min(1, "Name (English) is required"),
  description: z.string().optional(),
  display_order: z.coerce.number().min(1, "Display order must be >= 1"),
  is_active: z.boolean().default(true),
  is_display: z.boolean().default(true),
});
