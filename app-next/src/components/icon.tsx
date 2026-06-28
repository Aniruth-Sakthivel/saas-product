import {
  Activity,
  Banknote,
  BarChart3,
  BedDouble,
  CalendarCheck,
  Circle,
  ConciergeBell,
  Inbox,
  LayoutDashboard,
  LogIn,
  LogOut,
  Receipt,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Static registry of the icons referenced by string name across the app. */
const ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "calendar-check": CalendarCheck,
  "concierge-bell": ConciergeBell,
  "bed-double": BedDouble,
  users: Users,
  sparkles: Sparkles,
  receipt: Receipt,
  "bar-chart-3": BarChart3,
  settings: Settings,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  banknote: Banknote,
  "log-in": LogIn,
  "log-out": LogOut,
  activity: Activity,
  inbox: Inbox,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? Circle;
  return <Cmp className={cn("size-4", className)} />;
}
