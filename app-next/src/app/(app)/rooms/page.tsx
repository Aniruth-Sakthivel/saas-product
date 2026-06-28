import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Rooms · HotelOS" };

export default function RoomsPage() {
  return (
    <ComingSoon
      title="Rooms"
      description="Room types, rooms and live status."
      phase="Phase 2"
      icon="bed-double"
      features={["Room types CRUD", "Rooms CRUD", "Status board", "Floors"]}
    />
  );
}
