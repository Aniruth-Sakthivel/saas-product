import { z } from "zod";

/** Create/edit a platform plan from the admin console. */
export const planSchema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .min(2, "Code is required.")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only."),
  name: z.string().min(2, "Name is required."),
  description: z.string().max(300).optional().default(""),
  priceMonthly: z.coerce.number().min(0, "Must be zero or more."),
  priceYearly: z.coerce.number().min(0, "Must be zero or more."),
  currency: z.string().min(3).max(3).default("USD"),
  // Comma-separated feature keys in the form; split in the action.
  features: z.string().optional().default(""),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type PlanInput = z.infer<typeof planSchema>;

const SUBSCRIPTION_STATUSES = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "INCOMPLETE",
] as const;

export const setOrgStatusSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(SUBSCRIPTION_STATUSES),
});

export const changeOrgPlanSchema = z.object({
  organizationId: z.string().uuid(),
  planId: z.string().uuid(),
});
