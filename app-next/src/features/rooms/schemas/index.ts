import { z } from "zod";

export const roomTypeSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().optional().default(""),
  basePrice: z.coerce.number().min(0),
  capacity: z.coerce.number().int().min(1),
  beds: z.string().optional().default(""),
});

export const roomSchema = z.object({
  number: z.string().min(1, "Room number is required."),
  roomTypeId: z.string().uuid().optional(),
  floor: z.coerce.number().int().min(0),
  status: z.enum([
    "AVAILABLE",
    "OCCUPIED",
    "RESERVED",
    "CLEANING",
    "MAINTENANCE",
  ]),
});

export type RoomTypeInput = z.infer<typeof roomTypeSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
