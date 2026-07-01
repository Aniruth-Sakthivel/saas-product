/**
 * Presentational content for the guest-facing site. Room *data* is real (from
 * the DB); these are the curated marketing extras (amenities, offers, imagery)
 * that aren't modeled as tables. Client-safe.
 */

export interface Amenity {
  icon: string; // lucide icon name (see components/icon.tsx)
  title: string;
  description: string;
}

export const AMENITIES: Amenity[] = [
  { icon: "wifi", title: "High-speed Wi-Fi", description: "Complimentary fibre internet in every room and public space." },
  { icon: "utensils", title: "Fine dining", description: "Award-winning restaurant and 24-hour in-room dining." },
  { icon: "waves", title: "Pool & spa", description: "Rooftop infinity pool, sauna and full-service spa." },
  { icon: "dumbbell", title: "Fitness centre", description: "State-of-the-art gym open around the clock." },
  { icon: "car", title: "Valet parking", description: "Secure on-site parking with valet service." },
  { icon: "concierge-bell", title: "24/7 concierge", description: "Personalised service whenever you need it." },
];

export interface Offer {
  badge: string;
  title: string;
  description: string;
  cta: string;
}

export const OFFERS: Offer[] = [
  {
    badge: "Save 20%",
    title: "Early Bird Getaway",
    description: "Book 30 days ahead and enjoy 20% off your entire stay plus late checkout.",
    cta: "Book early",
  },
  {
    badge: "3 for 2",
    title: "Weekend Escape",
    description: "Stay three nights over a weekend and only pay for two. Breakfast included.",
    cta: "Plan a weekend",
  },
  {
    badge: "Members",
    title: "Loyalty Rewards",
    description: "Join free to unlock member rates, room upgrades and welcome amenities.",
    cta: "Join & save",
  },
];

/** A deterministic gradient for a room type so cards look designed without
 *  depending on external image hosting. */
const GRADIENTS = [
  "linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)",
  "linear-gradient(135deg,#0EA5E9 0%,#2563EB 100%)",
  "linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)",
  "linear-gradient(135deg,#10B981 0%,#0D9488 100%)",
  "linear-gradient(135deg,#EC4899 0%,#8B5CF6 100%)",
  "linear-gradient(135deg,#6366F1 0%,#06B6D4 100%)",
];

export function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

/** Small feature tags shown on each room card. */
export const ROOM_PERKS = ["Free Wi-Fi", "Breakfast", "Air conditioning", "Flat-screen TV"];
