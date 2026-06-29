import type { FeatureKey } from "@/lib/entitlements";

export interface ProductDef {
  key: string;
  name: string;
  description: string;
  icon: string; // lucide icon name (see components/icon.tsx)
  /** Entitlement feature that unlocks this product. */
  feature: FeatureKey;
  /** In-app route to launch the product (SSO — same session). */
  href?: string;
  status: "live" | "soon";
}

/**
 * The platform's product catalog. Surfaced in the Customer Portal. As new
 * products ship (Phase 8), add them here and gate access by `feature`.
 */
export const PRODUCTS: ProductDef[] = [
  {
    key: "hotel",
    name: "Hotel Management",
    description: "Reservations, front desk, housekeeping, billing and reports.",
    icon: "bed-double",
    feature: "hotel",
    href: "/dashboard",
    status: "live",
  },
  {
    key: "crm",
    name: "CRM",
    description: "Companies, contacts, leads and deals.",
    icon: "users",
    feature: "crm",
    status: "soon",
  },
  {
    key: "school",
    name: "School Management",
    description: "Students, staff, classes and fees.",
    icon: "layout-dashboard",
    feature: "analytics",
    status: "soon",
  },
  {
    key: "inventory",
    name: "Inventory",
    description: "Stock, suppliers and purchase orders.",
    icon: "inbox",
    feature: "analytics",
    status: "soon",
  },
];
