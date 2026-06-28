import { z } from "zod";
import { ROLES } from "@/lib/rbac";
import type { UserRole } from "@/types/database";

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Hotel name is required."),
  type: z.string().min(1, "Select a hotel type."),
  address: z.string().optional().default(""),
  currency: z.string().min(1).default("USD"),
  timezone: z.string().min(1).default("UTC"),
  brandColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #4F46E5")
    .default("#4F46E5"),
  rooms: z.coerce.number().int().min(0).optional().default(0),
  floors: z.coerce.number().int().min(0).optional().default(0),
});

const roleEnum = z.enum(ROLES as [UserRole, ...UserRole[]]);

export const inviteStaffSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  role: roleEnum,
});

export const updateRoleSchema = z.object({
  membershipId: z.string().uuid(),
  role: roleEnum,
});

export const removeMembershipSchema = z.object({
  membershipId: z.string().uuid(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
