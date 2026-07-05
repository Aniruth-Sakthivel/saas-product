"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/lib/use-sort";

interface Props {
  label: string;
  sortKey: string;
  activeKey: string | null;
  dir: SortDir;
  onSort: (key: string) => void;
  align?: "left" | "right";
  className?: string;
}

/** A clickable, sortable column header with a direction indicator. */
export function SortableHead({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = "left",
  className,
}: Props) {
  const active = activeKey === sortKey;
  const Indicator = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={cn(align === "right" && "text-right", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex select-none items-center gap-1 rounded transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        {label}
        <Indicator
          className={cn("size-3.5 shrink-0", active ? "opacity-100" : "opacity-40")}
        />
      </button>
    </TableHead>
  );
}
