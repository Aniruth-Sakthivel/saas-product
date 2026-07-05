import { createClient } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "@/types/database";

export interface TaskItem {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_at: string | null;
  roomNumber: string | null;
  notes: string | null;
}

export interface HousekeepingData {
  tasks: TaskItem[];
  statusCounts: Record<TaskStatus, number>;
}

const STATUSES: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "INSPECTION",
  "COMPLETED",
];

export async function getHousekeepingData(
  organizationId: string,
): Promise<HousekeepingData> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("housekeeping_tasks")
    .select("id, title, priority, status, due_at, notes, room:rooms(number)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    due_at: string | null;
    notes: string | null;
    room: { number: string } | null;
  };
  const tasks: TaskItem[] = ((data ?? []) as unknown as Row[]).map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    due_at: t.due_at,
    roomNumber: t.room?.number ?? null,
    notes: t.notes,
  }));

  const statusCounts = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<TaskStatus, number>,
  );
  for (const t of tasks) statusCounts[t.status]++;

  return { tasks, statusCounts };
}
