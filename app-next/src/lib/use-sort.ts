"use client";

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

/**
 * Small client-side sorting helper for data tables. Tracks the active column
 * and direction, and returns a stably-sorted copy of the rows. Numbers sort
 * numerically; strings use locale-aware, numeric-aware comparison; nullish
 * values sink to the bottom.
 */
export function useSort<T>(
  rows: T[],
  initialKey: keyof T | null = null,
  initialDir: SortDir = "asc",
) {
  const [sortKey, setSortKey] = useState<keyof T | null>(initialKey);
  const [dir, setDir] = useState<SortDir>(initialDir);

  function toggle(key: keyof T) {
    if (sortKey === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else if (typeof av === "boolean" && typeof bv === "boolean") {
        cmp = av === bv ? 0 : av ? -1 : 1;
      } else {
        cmp = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
      return dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, dir]);

  return { sorted, sortKey, dir, toggle };
}
