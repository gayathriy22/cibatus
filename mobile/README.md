# Cibatus Mobile

Production-quality React Native app (Expo) for Cibatus: track screentime, grow a plant, and stay mindful. Built with **Expo** (Expo Go compatible), **Supabase** (Auth + Postgres), and type-safe DB access.

## Tech stack

- **Expo** + **React Native** + **TypeScript**
- **expo-router** for file-based navigation
- **Supabase** (`@supabase/supabase-js`) for Auth only; **backend API** for all table access (no direct DB/RLS)
- **react-hook-form** + **zod** for forms and validation
- **@tanstack/react-query** for server state and caching
- **AsyncStorage** for lightweight local caching and screen-time simulation
- UI: React Native core components + shared theme tokens (beige, brown accent, soft green cards)

## Setup

1. **Clone and install**
   ```bash
   cd mobile
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`.
   - Set:
     - `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL (for Auth only).
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (Project Settings → API).
     - `EXPO_PUBLIC_API_URL` — Backend API base URL (e.g. `http://localhost:5000` or your deployed server). All table access and plant image upload go through this API; the app does not talk to Supabase DB or Storage directly.

3. **Backend**
   - Run the Flask server (see `../server/`) with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set. The API uses the service role to read/write tables and upload to Storage, so **no RLS policies are required** on the database.
   - Ensure the Storage bucket **`plant-images`** exists; the server uploads plant photos there.

4. **Run**
   ```bash
   npx expo start
   ```
   Then open in Expo Go (scan QR on device) or press `i` / `a` for simulator.

## Env vars

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (Auth only) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_API_URL` | Backend API base URL (all DB/Storage access) |

## Backend API

- All table access (users, timeHistory, plant, plantCharacter) and plant image upload go through the backend. The app sends `Authorization: Bearer <supabase_access_token>`; the server verifies the token and uses the **service role** client for DB and Storage. No RLS or direct Supabase DB/Storage from the app.

## Database schema (reference)

Tables used by the app:

- **users** — `user_id`, `auth_uid`, `plant_uid`, `first_name`, `daily_time_goal`, `apps_to_track`, `created_at`
- **timeHistory** — `history_id`, `user_id`, `date_time`, `daily_total`, `daily_pickups`
- **plant** — `plant_uid`, `plant_img_uri`, `plant_name`
- **plantCharacter** — `plant_character_id`, `plant_uid`, `character_health`, `character_image_uri`

Typed accessors and helpers live in `src/lib/db.ts`.

## New user flow and onboarding

The app avoids null-constraint errors by **not creating a `users` row until onboarding is complete**.

1. **Sign up** — Supabase Auth only (email, password). `first_name` is stored in `user_metadata`. No row is inserted into `users` yet.
2. **Redirect** — No session → auth. Session but **no user row** (or row missing required fields) → onboarding. User row exists and complete → tabs.
3. **Onboarding** — Goal (hours) → apps to track → plant name → plant photo (optional) → **loading**.
4. **Loading** — In one go: create `plant` row, **insert `users` row** with `auth_uid`, `first_name`, `daily_time_goal`, `apps_to_track`, `plant_uid`, then insert initial `plantCharacter` (“very healthy”), then navigate to Home. `first_name` comes from onboarding context (synced from sign-up `user_metadata` on the goal screen) or from `user_metadata`.

Profile is complete when a `users` row exists for the session’s `auth_uid` with `first_name`, `daily_time_goal`, `apps_to_track` (non-empty), and `plant_uid`.

## Screen time (mock vs real)

- **Expo Go:** iOS Screen Time APIs are not available. The app uses a **ScreenTimeProvider** abstraction that returns **mock** data and supports a **“Simulate screentime”** control (long-press “Today’s screentime” on the Stats tab) for demos.
- **Swapping to real native later:** Implement the same `ScreenTimeService` interface in a native module or dev client: `getTodayTotalMinutes()`, `getTodayPickups()`, `getPerAppBreakdown(apps)`. Replace the mock implementation in `src/lib/screenTime.ts` (or the provider) with one that calls the native module. No UI changes required.

## NFC / PairPot

- NFC pairing is not available in Expo Go. The app uses **manual flow**: onboarding creates a new plant and links it to the user (no physical “pairing” step).
- Code is structured so you can add a “tap-to-pair” (NFC) screen or manual `plant_uid` entry later; the rest of the app already keys off `users.plant_uid` and `plant` / `plantCharacter`.

## Plant health

- Health is derived from **daily total minutes** vs **daily goal (hours)**:
  - **good** (≤ goal) → “very healthy”
  - **okay** (≤ goal × 1.25) → “okay”
  - **bad** (> goal × 1.25) → “dying”
- The app writes **timeHistory** (e.g. once per day on open) and updates **plantCharacter** from the latest history so the home plant status reflects current behavior.

## Project structure

- `app/` — expo-router routes: `(auth)`, `(onboarding)`, `(tabs)`
- `src/components/` — shared UI (Button, Input, etc.)
- `src/features/auth/` — auth schemas
- `src/features/onboarding/` — onboarding steps (goal, apps, plant name, photo, loading)
- `src/features/plant/` — plant health mapping
- `src/features/stats/` — (stats UI lives under `app/(tabs)/stats.tsx`)
- `src/lib/` — Supabase client, DB accessors, storage, screen time service
- `src/hooks/` — useUserProfile, useOnboardingComplete, useTimeHistorySync, usePlantHealthUpdate
- `src/contexts/` — ScreenTime, Onboarding
- `src/theme/` — colors, spacing, typography tokens
- `src/types/` — DB and app types

## Scripts

- `npm start` — start Expo dev server
- `npm run ios` / `npm run android` — run on simulator/emulator

---

Replace `.env.example` with your real Supabase URL and anon key, then run `npx expo start` to try the app in Expo Go.
