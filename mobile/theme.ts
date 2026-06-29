// Design tokens mirroring the web app (app-next globals).
export const colors = {
  primary: "#4F46E5",
  success: "#059669",
  warning: "#F59E0B",
  danger: "#DC2626",
  background: "#FAFAFA",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
};

export const statusColor: Record<string, string> = {
  PENDING: colors.warning,
  CONFIRMED: colors.primary,
  CHECKED_IN: colors.success,
  CHECKED_OUT: colors.muted,
  CANCELLED: colors.danger,
};
