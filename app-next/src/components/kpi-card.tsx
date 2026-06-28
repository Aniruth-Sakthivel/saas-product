import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
  delta?: string;
  deltaUp?: boolean;
  sub?: string;
}

export function KpiCard({
  label,
  value,
  icon,
  delta,
  deltaUp,
  sub,
}: KpiCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon name={icon} className="size-[18px]" />
        </span>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              deltaUp
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            <Icon
              name={deltaUp ? "trending-up" : "trending-down"}
              className="size-3"
            />
            {delta}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </Card>
  );
}
