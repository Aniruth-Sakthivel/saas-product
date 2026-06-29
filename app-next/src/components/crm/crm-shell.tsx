"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview", href: "/crm" },
  { label: "Contacts", href: "/crm/contacts" },
  { label: "Deals", href: "/crm/deals" },
];

export function CrmShell({
  orgName,
  children,
}: {
  orgName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/crm" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Users className="size-[18px]" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">CRM</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {orgName}
            </span>
            <Link
              href="/portal"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Portal
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-6">
          {NAV.map((item) => {
            const active =
              item.href === "/crm"
                ? pathname === "/crm"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
