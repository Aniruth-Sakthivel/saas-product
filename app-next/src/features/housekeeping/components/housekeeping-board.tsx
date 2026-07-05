"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/types/database";
import type { HousekeepingData, TaskItem } from "@/features/housekeeping/services";
import {
  updateTaskStatusAction,
  createTaskAction,
} from "@/features/housekeeping/actions";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "INSPECTION", label: "Inspection" },
  { status: "COMPLETED", label: "Completed" },
];

const PRIORITY_VARIANT: Record<TaskPriority, "destructive" | "warning" | "secondary"> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

interface Props {
  organizationId: string;
  data: HousekeepingData;
  rooms: { id: string; number: string }[];
  canManage: boolean;
}

export function HousekeepingBoard({
  organizationId,
  data,
  rooms,
  canManage,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [roomId, setRoomId] = useState<string>("");
  useRealtimeRefresh(organizationId, ["housekeeping_tasks"], "housekeeping");

  function move(taskId: string, status: TaskStatus) {
    startTransition(async () => {
      const res = await updateTaskStatusAction({ taskId, status });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Task updated.");
      router.refresh();
    });
  }

  function add() {
    if (title.trim().length < 2) return toast.error("Enter a task title.");
    startTransition(async () => {
      const res = await createTaskAction({
        title,
        priority,
        roomId: roomId || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Task created.");
      setTitle("");
      setRoomId("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {canManage && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
          <Input
            placeholder="New task title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-xs"
          />
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Room (optional)" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  Room {r.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as TaskPriority)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["LOW", "MEDIUM", "HIGH"] as TaskPriority[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={add} disabled={pending}>
            Add task
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = data.tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="rounded-xl border bg-muted/20">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="rounded-full bg-background px-2 text-xs">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2 p-2">
                {items.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Nothing here
                  </p>
                )}
                {items.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    canManage={canManage}
                    pending={pending}
                    onMove={move}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  canManage,
  pending,
  onMove,
}: {
  task: TaskItem;
  canManage: boolean;
  pending: boolean;
  onMove: (id: string, status: TaskStatus) => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium">{task.title}</span>
        <Badge variant={PRIORITY_VARIANT[task.priority]}>
          {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
        </Badge>
      </div>
      {task.roomNumber && (
        <div className="mt-1 text-xs text-muted-foreground">
          Room {task.roomNumber}
        </div>
      )}
      {canManage && (
        <Select
          value={task.status}
          onValueChange={(v) => onMove(task.id, v as TaskStatus)}
          disabled={pending}
        >
          <SelectTrigger className={cn("mt-2 h-8 text-xs")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLUMNS.map((c) => (
              <SelectItem key={c.status} value={c.status}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
