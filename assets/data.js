/* HotelOS — Static mock data */
(function () {
  const firstNames = ["James","Olivia","Liam","Emma","Noah","Ava","Lucas","Sophia","Mason","Isabella","Ethan","Mia","Logan","Charlotte","Aiden","Amelia","Daniel","Harper","Mateo","Evelyn","Henry","Abigail","Jack","Emily","Owen","Ella","Leo","Scarlett","Ryan","Grace","Nathan","Chloe","Samuel","Victoria","David","Aria","Julian","Lily","Adrian","Zoe","Gabriel","Nora","Anthony","Hazel","Dylan","Aurora","Caleb","Layla","Isaac","Riley"];
  const lastNames = ["Carter","Bennett","Hughes","Ward","Foster","Reed","Cole","Bryant","Hayes","Murphy","Ross","Sanders","Powell","Long","Patterson","Brooks","Torres","Gray","Ramirez","Price","Wood","Barnes","Kelly","Russell","Coleman","Jenkins","Perry","Powers","Fisher","Henderson","Coleman","Simmons","Foster","Bishop","Chapman","Nguyen","Khan","Silva","Rossi","Müller","Tanaka","Lopez","Ferrari","Andersen","Novak","Costa","Walsh","Dean","Mills","Hart"];
  const cities = ["New York, USA","London, UK","Berlin, DE","Paris, FR","Tokyo, JP","Sydney, AU","Toronto, CA","Dubai, AE","Singapore, SG","Mumbai, IN","Madrid, ES","Rome, IT","Amsterdam, NL","Seoul, KR","São Paulo, BR"];
  const roomTypes = [
    { type: "Standard Queen", price: 129, beds: "1 Queen" },
    { type: "Deluxe King", price: 189, beds: "1 King" },
    { type: "Twin Room", price: 149, beds: "2 Twin" },
    { type: "Executive Suite", price: 329, beds: "1 King + Sofa" },
    { type: "Family Suite", price: 279, beds: "2 Queen" },
    { type: "Presidential Suite", price: 599, beds: "1 King + Living" },
  ];
  const prefs = ["High floor","Non-smoking","Extra pillows","Late checkout","Vegetarian meals","Quiet room","Ocean view","Early check-in","Hypoallergenic","Airport pickup"];
  const roomStatuses = ["Available","Occupied","Reserved","Cleaning","Maintenance"];

  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  let seed = 42;
  const srnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const pick = (a) => a[Math.floor(srnd() * a.length)];
  const pint = (min, max) => Math.floor(srnd() * (max - min + 1)) + min;

  function fmtDate(d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  const today = new Date(2026, 5, 28);

  // ---- Guests (50) ----
  const guests = [];
  for (let i = 0; i < 50; i++) {
    const fn = pick(firstNames), ln = pick(lastNames);
    const name = `${fn} ${ln}`;
    const visits = pint(1, 18);
    guests.push({
      id: "G" + (1000 + i),
      name, initials: (fn[0] + ln[0]).toUpperCase(),
      phone: `+1 (${pint(200,989)}) ${pint(200,989)}-${pint(1000,9999)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${pick(["gmail.com","outlook.com","proton.me","company.io"])}`,
      city: pick(cities),
      visits,
      totalSpend: visits * pint(180, 950),
      lastStay: fmtDate(addDays(today, -pint(2, 420))),
      preferences: [pick(prefs), pick(prefs)].filter((v, idx, s) => s.indexOf(v) === idx),
      vip: srnd() > 0.8,
      notes: pick(["Frequent business traveler.","Prefers corner rooms.","Celebrated anniversary last visit.","Allergic to feather pillows.","Loyalty gold member.","No special notes."]),
    });
  }

  // ---- Rooms (101–150) ----
  const rooms = [];
  for (let n = 101; n <= 150; n++) {
    const rt = roomTypes[(n - 101) % roomTypes.length];
    const status = pick(roomStatuses);
    const floor = Math.floor(n / 100) === 1 ? Math.floor((n - 100) / 12) + 1 : 1;
    const occupied = status === "Occupied" || status === "Reserved";
    rooms.push({
      number: String(n),
      type: rt.type,
      beds: rt.beds,
      floor: Math.min(5, Math.floor((n - 101) / 10) + 1),
      price: rt.price,
      status,
      guest: occupied ? pick(guests).name : null,
    });
  }

  // ---- Reservations (30) ----
  const resStatuses = ["Confirmed","Pending","Checked-in","Cancelled"];
  const payStatuses = ["Paid","Pending","Refunded","Partial"];
  const reservations = [];
  for (let i = 0; i < 30; i++) {
    const g = pick(guests);
    const room = pick(rooms);
    const inOffset = pint(-3, 20);
    const ci = addDays(today, inOffset);
    const nights = pint(1, 9);
    const co = addDays(ci, nights);
    const status = pick(resStatuses);
    reservations.push({
      id: "RSV-" + (2050 + i),
      guest: g.name, initials: g.initials, email: g.email, phone: g.phone, vip: g.vip,
      room: room.number, roomType: room.type,
      checkIn: ci, checkOut: co, checkInStr: fmtDate(ci), checkOutStr: fmtDate(co),
      nights, guestsCount: pint(1, 4),
      status, payment: pick(payStatuses),
      total: room.price * nights, source: pick(["Direct","Booking.com","Expedia","Airbnb","Corporate"]),
    });
  }

  // ---- Invoices (20) ----
  const invStatuses = ["Paid","Pending","Overdue","Refunded"];
  const methods = ["Visa ••4821","Mastercard ••9012","Amex ••1003","Bank Transfer","Cash","PayPal"];
  const invoices = [];
  for (let i = 0; i < 20; i++) {
    const g = pick(guests);
    invoices.push({
      id: "INV-" + (90120 + i),
      guest: g.name, initials: g.initials,
      amount: pint(180, 4200),
      status: pick(invStatuses),
      method: pick(methods),
      date: fmtDate(addDays(today, -pint(0, 40))),
      room: pick(rooms).number,
    });
  }

  // ---- Housekeeping tasks ----
  const hkPriorities = ["High","Medium","Low"];
  const hkCols = ["Pending","In Progress","Inspection","Completed"];
  const staff = ["Maria S.","Kofi A.","Lena P.","Diego R.","Anya K.","Tomas B.","Priya N.","Sam O."];
  const housekeeping = [];
  for (let i = 0; i < 16; i++) {
    const r = pick(rooms);
    housekeeping.push({
      id: "HK-" + (300 + i),
      room: r.number, type: r.type,
      priority: pick(hkPriorities),
      staff: pick(staff),
      due: `${pint(9, 17)}:${pick(["00","15","30","45"])}`,
      col: pick(hkCols),
      task: pick(["Full clean","Linen change","Turndown service","Deep clean","Restock minibar","Inspect plumbing"]),
    });
  }

  // ---- Activity feed ----
  const activities = [
    { icon: "log-in", color: "indigo", text: "Olivia Bennett checked in to Room 204", time: "2m ago" },
    { icon: "credit-card", color: "emerald", text: "Payment of $1,240 received from James Carter", time: "18m ago" },
    { icon: "calendar-plus", color: "indigo", text: "New reservation RSV-2061 created", time: "44m ago" },
    { icon: "sparkles", color: "amber", text: "Room 118 marked clean by Maria S.", time: "1h ago" },
    { icon: "log-out", color: "gray", text: "Ethan Murphy checked out from Room 132", time: "2h ago" },
    { icon: "alert-triangle", color: "red", text: "Maintenance request opened for Room 145", time: "3h ago" },
  ];

  // ---- Chart series ----
  const revenueTrend = [12,15,14,18,21,19,24,26,23,28,31,29,34,38,36,41].map((v) => v * 1000);
  const occupancyTrend = [62,65,61,70,74,72,78,81,76,84,88,85,90,87,92,94];

  window.HOTEL = {
    today, fmtDate, addDays,
    guests, rooms, reservations, invoices, housekeeping, activities,
    roomTypes, hkCols, resStatuses,
    revenueTrend, occupancyTrend,
    kpis: {
      occupancy: 87,
      revenue: 41280,
      arrivals: 14,
      departures: 9,
    },
  };
})();
