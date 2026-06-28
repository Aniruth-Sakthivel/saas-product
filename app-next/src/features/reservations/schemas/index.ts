import { z } from "zod";

export const reservationSchema = z
  .object({
    guestId: z.string().uuid(),
    roomTypeId: z.string().uuid().optional(),
    roomId: z.string().uuid().optional(),
    checkIn: z.string().min(1, "Check-in date is required."),
    checkOut: z.string().min(1, "Check-out date is required."),
    guestsCount: z.coerce.number().int().min(1),
    source: z.string().default("Direct"),
    status: z
      .enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"])
      .default("PENDING"),
  })
  .refine((v) => new Date(v.checkOut) > new Date(v.checkIn), {
    message: "Check-out must be after check-in.",
    path: ["checkOut"],
  });

export type ReservationInput = z.infer<typeof reservationSchema>;
