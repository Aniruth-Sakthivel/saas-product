# HotelOS — SaaS Dashboard Prototype

A high-fidelity, frontend-only hotel management dashboard. Pure **HTML + Tailwind CSS** (CDN) with **static mock data** and **Lucide icons**. No backend.

## Run

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Pages

| File | Page |
|------|------|
| `index.html` | Dashboard (KPIs, charts, AI insights, widgets) |
| `reservations.html` | Bookings table + filters + details drawer |
| `front-desk.html` | Arrivals / departures / in-house + quick actions |
| `rooms.html` | Room cards with floor & status filters |
| `guests.html` | CRM table + guest profile drawer |
| `housekeeping.html` | Kanban task board |
| `billing.html` | Invoices, payments & revenue |
| `reports.html` | Analytics dashboard |
| `settings.html` | Tabbed settings |

## Architecture

- `assets/data.js` — seeded mock data (50 rooms, 50 guests, 30 reservations, 20 invoices, tasks).
- `assets/shell.js` — reusable layout (sidebar, topbar) + components (`UI.kpiCard`, `UI.badge`, `UI.avatar`, `UI.sectionCard`, `UI.emptyState`, `UI.lineChart`, `UI.barChart`, `UI.donut`) + `openDrawer` / `openModal`.

## Design tokens

Primary `#4F46E5` · Success `#059669` · Warning `#F59E0B` · Danger `#DC2626` · Background `#FAFAFA` · Border `#E5E7EB`. Inter typeface, 12px radius, soft borders, subtle shadows.

## Responsive

Desktop: full sidebar (collapsible via topbar toggle). Tablet/mobile: off-canvas drawer navigation with overlay.
