import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "outline";

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  // reservations
  CONFIRMED: "default",
  PENDING: "warning",
  CHECKED_IN: "success",
  CHECKED_OUT: "secondary",
  CANCELLED: "destructive",
  // rooms
  AVAILABLE: "success",
  OCCUPIED: "default",
  RESERVED: "secondary",
  CLEANING: "warning",
  MAINTENANCE: "destructive",
  // tasks
  IN_PROGRESS: "default",
  INSPECTION: "warning",
  COMPLETED: "success",
  // payments / invoices
  PAID: "success",
  PARTIAL: "warning",
  OVERDUE: "destructive",
  REFUNDED: "secondary",
  DRAFT: "outline",
  // priorities
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

function humanize(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = STATUS_VARIANT[status] ?? "outline";
  return (
    <Badge variant={variant} className={cn("font-medium", className)}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {humanize(status)}
    </Badge>
  );
}
