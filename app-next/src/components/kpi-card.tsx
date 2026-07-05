import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

export type KpiTone =
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "violet";

/** Full class strings so Tailwind can statically detect each gradient. */
const TONES: Record<KpiTone, string> = {
  indigo: "from-indigo-500 to-violet-500 shadow-indigo-500/30",
  emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
  amber: "from-amber-500 to-orange-500 shadow-amber-500/30",
  rose: "from-rose-500 to-pink-500 shadow-rose-500/30",
  sky: "from-sky-500 to-blue-500 shadow-sky-500/30",
  violet: "from-violet-500 to-fuchsia-500 shadow-violet-500/30",
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
  delta?: string;
  deltaUp?: boolean;
  sub?: string;
  tone?: KpiTone;
}

export function KpiCard({
  label,
  value,
  icon,
  delta,
  deltaUp,
  sub,
  tone = "indigo",
}: KpiCardProps) {
  return (
    <Card className="elevate-hover p-5">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm",
            TONES[tone],
          )}
        >
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
      <p className="mt-4 text-[13px] font-medium text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </Card>
  );
}
