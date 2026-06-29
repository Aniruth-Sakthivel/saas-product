"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NameValue } from "@/features/admin/services/analytics";

const PALETTE = ["#4F46E5", "#059669", "#F59E0B", "#DC2626", "#6B7280"];

export function OrgGrowthChart({ data }: { data: NameValue[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis hide allowDecimals={false} />
        <Tooltip formatter={(v: number) => [v, "New orgs"]} />
        <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DistributionChart({ data }: { data: NameValue[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
