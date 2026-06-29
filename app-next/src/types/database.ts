/**
 * Hand-authored Supabase database types mirroring supabase/migrations.
 * Regenerate with `supabase gen types typescript` once the CLI is linked.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | "OWNER"
  | "MANAGER"
  | "RECEPTIONIST"
  | "HOUSEKEEPING"
  | "ACCOUNTANT";
export type MembershipStatus = "INVITED" | "ACTIVE" | "DISABLED";
export type RoomStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "CLEANING"
  | "MAINTENANCE";
export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "INSPECTION" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "PARTIAL"
  | "REFUNDED"
  | "FAILED";
export type PaymentMethod =
  | "CARD"
  | "CASH"
  | "BANK_TRANSFER"
  | "UPI"
  | "PAYPAL"
  | "OTHER";
export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "PAID"
  | "OVERDUE"
  | "REFUNDED"
  | "CANCELLED";
export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "INCOMPLETE";
export type BillingInterval = "MONTHLY" | "YEARLY";

/** Helper to derive Insert/Update shapes from a Row. */
type Timestamps = "created_at" | "updated_at";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  type: string;
  address: string | null;
  currency: string;
  timezone: string;
  logo_url: string | null;
  brand_color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
type MembershipRow = {
  id: string;
  organization_id: string;
  profile_id: string | null;
  role: UserRole;
  status: MembershipStatus;
  invited_email: string | null;
  invite_token: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}
type RoomTypeRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  base_price: number;
  capacity: number;
  beds: string | null;
  created_at: string;
  updated_at: string;
}
type RoomRow = {
  id: string;
  organization_id: string;
  number: string;
  room_type_id: string | null;
  floor: number;
  status: RoomStatus;
  created_at: string;
  updated_at: string;
}
type GuestRow = {
  id: string;
  organization_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  vip: boolean;
  preferences: Json;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
type ReservationRow = {
  id: string;
  organization_id: string;
  code: string;
  guest_id: string;
  room_id: string | null;
  room_type_id: string | null;
  check_in: string;
  check_out: string;
  guests_count: number;
  status: ReservationStatus;
  source: string;
  total: number;
  created_at: string;
  updated_at: string;
}
type StayRow = {
  id: string;
  organization_id: string;
  reservation_id: string;
  room_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  created_at: string;
  updated_at: string;
}
type InvoiceRow = {
  id: string;
  organization_id: string;
  number: string;
  reservation_id: string | null;
  guest_id: string | null;
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
  status: InvoiceStatus;
  issued_at: string;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}
type PaymentRow = {
  id: string;
  organization_id: string;
  invoice_id: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  paid_at: string;
  created_at: string;
  updated_at: string;
}
type HousekeepingTaskRow = {
  id: string;
  organization_id: string;
  room_id: string | null;
  assignee_membership_id: string | null;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
type AuditLogRow = {
  id: string;
  organization_id: string;
  actor_profile_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
}

type PlanRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: Json;
  limits: Json;
  stripe_product_id: string | null;
  stripe_price_monthly_id: string | null;
  stripe_price_yearly_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
type SubscriptionRow = {
  id: string;
  organization_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  interval: BillingInterval;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

type TableShape<
  Row,
  RequiredInsert extends keyof Row = never,
  Rel extends readonly unknown[] = [],
> = {
  Row: Row;
  Insert: Partial<Omit<Row, Timestamps | "id">> &
    Pick<Row, RequiredInsert & keyof Row> & { id?: string };
  Update: Partial<Omit<Row, Timestamps>>;
  Relationships: Rel;
};

type MembershipRelationships = [
  {
    foreignKeyName: "memberships_profile_id_fkey";
    columns: ["profile_id"];
    isOneToOne: false;
    referencedRelation: "profiles";
    referencedColumns: ["id"];
  },
  {
    foreignKeyName: "memberships_organization_id_fkey";
    columns: ["organization_id"];
    isOneToOne: false;
    referencedRelation: "organizations";
    referencedColumns: ["id"];
  },
];

export type Database = {
  public: {
    Tables: {
      profiles: TableShape<ProfileRow, "id" | "email">;
      organizations: TableShape<OrganizationRow, "name" | "slug" | "created_by">;
      memberships: TableShape<
        MembershipRow,
        "organization_id",
        MembershipRelationships
      >;
      room_types: TableShape<RoomTypeRow, "organization_id" | "name">;
      rooms: TableShape<RoomRow, "organization_id" | "number">;
      guests: TableShape<GuestRow, "organization_id" | "full_name">;
      reservations: TableShape<
        ReservationRow,
        "organization_id" | "code" | "guest_id" | "check_in" | "check_out"
      >;
      stays: TableShape<
        StayRow,
        "organization_id" | "reservation_id" | "room_id"
      >;
      invoices: TableShape<InvoiceRow, "organization_id" | "number">;
      payments: TableShape<PaymentRow, "organization_id" | "amount">;
      housekeeping_tasks: TableShape<HousekeepingTaskRow, "organization_id">;
      audit_logs: TableShape<
        AuditLogRow,
        "organization_id" | "action" | "entity"
      >;
      plans: TableShape<PlanRow, "code" | "name">;
      subscriptions: TableShape<
        SubscriptionRow,
        "organization_id" | "plan_id"
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_org_member: { Args: { org: string }; Returns: boolean };
      has_org_role: { Args: { org: string; roles: UserRole[] }; Returns: boolean };
      org_has_feature: { Args: { org: string; feature: string }; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      membership_status: MembershipStatus;
      room_status: RoomStatus;
      reservation_status: ReservationStatus;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      invoice_status: InvoiceStatus;
      subscription_status: SubscriptionStatus;
      billing_interval: BillingInterval;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases
export type Profile = ProfileRow;
export type Organization = OrganizationRow;
export type Membership = MembershipRow;
export type RoomType = RoomTypeRow;
export type Room = RoomRow;
export type Guest = GuestRow;
export type Reservation = ReservationRow;
export type Stay = StayRow;
export type Invoice = InvoiceRow;
export type Payment = PaymentRow;
export type HousekeepingTask = HousekeepingTaskRow;
export type AuditLog = AuditLogRow;
export type Plan = PlanRow;
export type Subscription = SubscriptionRow;
