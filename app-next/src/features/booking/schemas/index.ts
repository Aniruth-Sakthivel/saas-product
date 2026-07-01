import { z } from "zod";

const afterCheckIn = (v: { checkIn: string; checkOut: string }) =>
  new Date(v.checkOut) > new Date(v.checkIn);

/** Shared base fields for the booking flow. */
const searchBase = z.object({
  checkIn: z.string().min(1, "Select a check-in date."),
  checkOut: z.string().min(1, "Select a check-out date."),
  guests: z.coerce.number().int().min(1, "At least one guest.").max(20),
  roomTypeId: z.string().uuid().optional(),
});

/** Search / availability query for the public booking flow. */
export const availabilitySearchSchema = searchBase.refine(afterCheckIn, {
  message: "Check-out must be after check-in.",
  path: ["checkOut"],
});

export type AvailabilitySearch = z.infer<typeof availabilitySearchSchema>;

/** Full public booking submission (search + chosen room + guest details). */
export const publicBookingSchema = searchBase
  .extend({
    roomTypeId: z.string().uuid("Please choose a room."),
    fullName: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email."),
    phone: z.string().min(6, "Enter a contact number."),
    city: z.string().optional().default(""),
    notes: z.string().max(500).optional().default(""),
  })
  .refine(afterCheckIn, {
    message: "Check-out must be after check-in.",
    path: ["checkOut"],
  });

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
