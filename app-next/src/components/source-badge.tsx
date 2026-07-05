import { cn } from "@/lib/utils";

/** Distinct colour per booking channel for quick visual scanning. */
const SOURCE_STYLES: Record<string, string> = {
  Website: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  Direct: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Booking.com": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  Expedia: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Airbnb: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  Corporate: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

export function SourceBadge({ source }: { source: string }) {
  const style =
    SOURCE_STYLES[source] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        style,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {source}
    </span>
  );
}
