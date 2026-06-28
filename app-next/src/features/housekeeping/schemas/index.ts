import { z } from "zod";

export const housekeepingTaskSchema = z.object({
  roomId: z.string().uuid().optional(),
  assigneeMembershipId: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required.").default("Full clean"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  status: z
    .enum(["PENDING", "IN_PROGRESS", "INSPECTION", "COMPLETED"])
    .default("PENDING"),
  dueAt: z.string().optional(),
  notes: z.string().optional().default(""),
});

export type HousekeepingTaskInput = z.infer<typeof housekeepingTaskSchema>;
