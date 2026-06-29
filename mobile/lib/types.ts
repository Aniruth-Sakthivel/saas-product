// Minimal row types shared with the web app's schema (subset of
// app-next/src/types/database.ts). Mobile only needs what it renders.

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";

export type Reservation = {
  id: string;
  organization_id: string;
  code: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  status: ReservationStatus;
  total: number;
};

export type Organization = {
  id: string;
  name: string;
  currency: string;
};

export type Membership = {
  id: string;
  organization_id: string;
  role: string;
  organization: Organization;
};
