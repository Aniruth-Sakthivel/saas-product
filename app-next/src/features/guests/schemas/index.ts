import { z } from "zod";

export const guestSchema = z.object({
  fullName: z.string().min(2, "Guest name is required."),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  city: z.string().optional().default(""),
  vip: z.coerce.boolean().optional().default(false),
  preferences: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(""),
});

export type GuestInput = z.infer<typeof guestSchema>;
