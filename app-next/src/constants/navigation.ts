import type { Permission } from "@/lib/rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name
  permission?: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  {
    label: "Reservations",
    href: "/reservations",
    icon: "calendar-check",
    permission: "reservations:manage",
  },
  {
    label: "Front Desk",
    href: "/frontdesk",
    icon: "concierge-bell",
    permission: "frontdesk:operate",
  },
  {
    label: "Rooms",
    href: "/rooms",
    icon: "bed-double",
    permission: "rooms:manage",
  },
  {
    label: "Guests",
    href: "/guests",
    icon: "users",
    permission: "guests:manage",
  },
  {
    label: "Housekeeping",
    href: "/housekeeping",
    icon: "sparkles",
    permission: "housekeeping:manage",
  },
  {
    label: "Billing",
    href: "/billing",
    icon: "receipt",
    permission: "billing:manage",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "bar-chart-3",
    permission: "reports:view",
  },
  { label: "Settings", href: "/settings", icon: "settings" },
];
