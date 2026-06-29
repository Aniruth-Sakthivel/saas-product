# HotelOS Mobile (Expo)

The React Native + Expo mobile client for HotelOS — **Phase 6**. It talks to the
**same Supabase backend** as the web app (`app-next/`); Row Level Security
enforces tenant isolation, so no separate API layer is needed.

## Stack
- Expo (SDK 52) + Expo Router (file-based navigation, typed routes)
- `@supabase/supabase-js` with AsyncStorage session persistence
- Shared design tokens (`theme.ts`) mirroring the web app

## Setup
```bash
cd mobile
npm install
cp .env.example .env      # fill EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY (same project as web)
npm start                 # then press i / a, or scan the QR with Expo Go
```

Use the **same Supabase URL + anon key** as `app-next/.env.local`
(`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## What works
- **Auth** — email/password sign-in against Supabase; session persists across restarts.
- **Dashboard** — live KPIs (rooms, today's arrivals, in-house), pull-to-refresh.
- **Reservations** — live list with status badges, pull-to-refresh.

## Structure
```
app/
  _layout.tsx          root + auth gate (redirects login <-> tabs)
  index.tsx            session-based redirect
  login.tsx            sign-in screen
  (tabs)/
    _layout.tsx        bottom tabs
    index.tsx          dashboard
    reservations.tsx   reservations list
lib/
  supabase.ts          Supabase client (AsyncStorage)
  auth.tsx             AuthProvider + useAuth (session + active org)
  types.ts             row types (subset of web schema)
theme.ts               design tokens
```

## Roadmap (per blueprint, not yet built)
- Offline support + sync queue
- Push notifications
- Front desk / housekeeping screens
- Dark mode palette (currently light; `userInterfaceStyle: automatic` is enabled)
