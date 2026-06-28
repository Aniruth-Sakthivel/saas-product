import type { UserRole } from "@/types/database";

/** Fine-grained permissions enforced in UI and Server Actions (mirrors RLS). */
export type Permission =
  | "org:update"
  | "org:delete"
  | "staff:manage"
  | "rooms:manage"
  | "reservations:manage"
  | "frontdesk:operate"
  | "guests:manage"
  | "housekeeping:manage"
  | "billing:manage"
  | "reports:view";

export const ROLES: UserRole[] = [
  "OWNER",
  "MANAGER",
  "RECEPTIONIST",
  "HOUSEKEEPING",
  "ACCOUNTANT",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  RECEPTIONIST: "Receptionist",
  HOUSEKEEPING: "Housekeeping",
  ACCOUNTANT: "Accountant",
};

const ALL: Permission[] = [
  "org:update",
  "org:delete",
  "staff:manage",
  "rooms:manage",
  "reservations:manage",
  "frontdesk:operate",
  "guests:manage",
  "housekeeping:manage",
  "billing:manage",
  "reports:view",
];

export const PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: ALL,
  MANAGER: [
    "org:update",
    "staff:manage",
    "rooms:manage",
    "reservations:manage",
    "frontdesk:operate",
    "guests:manage",
    "housekeeping:manage",
    "billing:manage",
    "reports:view",
  ],
  RECEPTIONIST: [
    "reservations:manage",
    "frontdesk:operate",
    "guests:manage",
    "reports:view",
  ],
  HOUSEKEEPING: ["housekeeping:manage", "rooms:manage"],
  ACCOUNTANT: ["billing:manage", "reports:view"],
};

export function can(role: UserRole | null | undefined, permission: Permission) {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyRole(
  role: UserRole | null | undefined,
  roles: UserRole[],
) {
  return !!role && roles.includes(role);
}
