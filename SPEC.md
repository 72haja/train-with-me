# Project Spec -- VVS Together (train-with-me)

## Purpose

VVS Together is a web-based transit companion app for the Stuttgart metropolitan area (VVS region). It lets users search public transport connections, join specific trains, and see which friends are on the same journey. The core workflow: search a route, pick a connection, join it, and coordinate with friends who joined the same physical train.

No timetable data is stored long-term. All connection data is fetched live from the public VVS EFA API.

---

## Tech Stack

| Layer         | Technology                                            |
| ------------- | ----------------------------------------------------- |
| Framework     | Next.js 16.1.6 (App Router)                           |
| Language      | TypeScript 5.9                                        |
| Runtime       | Bun                                                   |
| React         | React 19.2 with React Compiler enabled                |
| Database      | Supabase (PostgreSQL) with RLS                        |
| Auth          | Supabase Auth (email/password)                        |
| Transit Data  | VVS EFA public API (no auth required)                 |
| Styling       | SCSS Modules (per-component), Tailwind CSS classes    |
| Animations    | motion (Framer Motion v12)                            |
| Data Fetching | SWR (client), `"use cache"` (server)                  |
| Icons         | lucide-react                                          |
| Linting       | @becklyn/eslint, @becklyn/prettier, @becklyn/tsconfig |

---

## Project Structure

```
train-with-me/
  app/                        # Next.js App Router
    actions/                  # Server actions (auth, profile)
    api/                      # API route handlers
      connections/            # Search, join, leave, friends-on-train
      favorites/              # Favorite routes CRUD
      friends/                # Friendships, requests, accept/decline
      stations/               # Station search via EFA
      vvs/                    # Departure monitor (cached)
    auth/                     # Sign-in / Sign-up pages
    components/               # Page-level client components (forms, profile)
    connections/              # Connections search results + detail pages
      [id]/                   # Single connection detail
      hooks/                  # Page-specific hooks (search, favorites, join)
    friends/                  # Friends list page
    hooks/                    # App-level hooks (useMyConnections)
    lib/                      # Utilities (fetcher, server-data helpers)
    profile/                  # User profile page
    layout.tsx                # Root layout (Geist fonts)
    page.tsx                  # Home page (redirects if unauthenticated)
    globals.scss              # Global styles and design tokens

  packages/
    apis/                     # API clients and data access
      hooks/                  # useSession (auth state hook)
      supabase/               # Supabase client factories, DB types, queries
      vvs-efa/                # VVS EFA API client, mappers, types
      mockStations.ts         # Fallback station data
      supabase.ts             # Legacy client file (mostly unused)
    types/                    # Shared TypeScript type definitions
      lib/types/              # Connection, Station, Friend types
    ui/                       # Component library (Atomic Design)
      atoms/                  # Button, Input, Autocomplete, LineBadge, LoadingSpinner, etc.
      molecules/              # ConnectionCard, RouteSearchForm, StationAutocomplete, etc.
      organisms/              # HomeScreen, TrainDetailsScreen, AuthScreen

  scripts/
    gen-types.ts              # Generates Supabase DB types from remote schema

  supabase/                   # Supabase local config (mostly empty)
```

### Path Aliases (tsconfig)

| Alias     | Maps to                               |
| --------- | ------------------------------------- |
| `@/*`     | `./*` (project root)                  |
| `@ui/*`   | `./packages/ui/*`                     |
| `@apis/*` | `./packages/apis/*`                   |
| `@types`  | `./packages/types/lib/types/index.ts` |

---

## Database Schema (Supabase / PostgreSQL)

### `profiles`

Mirrors Supabase Auth users. Auto-linked by `id`.

| Column       | Type      | Notes                    |
| ------------ | --------- | ------------------------ |
| `id`         | uuid (PK) | = Supabase auth user ID  |
| `email`      | text      |                          |
| `full_name`  | text      |                          |
| `avatar_url` | text      | Path in `avatars` bucket |
| `created_at` | timestamp |                          |
| `updated_at` | timestamp |                          |

### `friendships`

Bidirectional friend relationships with status lifecycle: pending -> accepted.

| Column       | Type      | Notes                                    |
| ------------ | --------- | ---------------------------------------- |
| `id`         | uuid (PK) |                                          |
| `user_id`    | uuid (FK) | Requester                                |
| `friend_id`  | uuid (FK) | Recipient                                |
| `status`     | text      | `"pending"` / `"accepted"` / `"blocked"` |
| `created_at` | timestamp |                                          |
| `updated_at` | timestamp |                                          |

### `user_connections`

Tracks which users have joined which train connections. Soft-delete via `left_at`.

| Column                     | Type      | Notes                                     |
| -------------------------- | --------- | ----------------------------------------- |
| `id`                       | uuid (PK) |                                           |
| `user_id`                  | uuid      |                                           |
| `connection_id`            | text      | Deterministic ID from EFA data            |
| `trip_id`                  | text      | EFA stateless trip ID for friend matching |
| `joined_at`                | timestamp |                                           |
| `left_at`                  | timestamp | null = active, set = left                 |
| `origin_station_id`        | text      |                                           |
| `origin_station_name`      | text      |                                           |
| `destination_station_id`   | text      |                                           |
| `destination_station_name` | text      |                                           |
| `departure_time`           | text      |                                           |
| `arrival_time`             | text      |                                           |
| `line_number`              | text      | e.g. "S1", "U6"                           |
| `line_type`                | text      | e.g. "S-Bahn", "U-Bahn"                   |
| `line_color`               | text      | Hex color                                 |
| `line_direction`           | text      | Terminus station name                     |

### `favorite_connections`

Saved origin-destination pairs for quick access.

| Column                     | Type      | Notes                        |
| -------------------------- | --------- | ---------------------------- |
| `id`                       | uuid (PK) |                              |
| `user_id`                  | uuid      |                              |
| `origin_station_id`        | text      |                              |
| `destination_station_id`   | text      |                              |
| `origin_station_name`      | text      | Fetched from EFA on creation |
| `destination_station_name` | text      | Fetched from EFA on creation |
| `created_at`               | timestamp |                              |

### Supabase Storage

- **Bucket: `avatars`** -- profile pictures, path: `{userId}/{userId}-{timestamp}.{ext}`

---

## External API -- VVS EFA

**Base URL:** `https://efastatic.vvs.de/umweltrechner`
**Auth:** None required (public API). Always appends `outputFormat=JSON`.

| Endpoint                 | Used For                  | Key Params                                                                                    |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `XML_STOPFINDER_REQUEST` | Station search by name/ID | `type_sf=stop`, `name_sf`, `anyObjFilter_sf=3` (rail)                                         |
| `XML_TRIP_REQUEST2`      | Connection search         | `name_origin`, `name_destination`, `itdDate`, `itdTime`, `calcNumberOfTrips`, `useRealtime=1` |
| `XML_DM_REQUEST`         | Departure monitor         | `type_dm=stop`, `name_dm`, `itdDate`, `itdTime`, `limit`, `useRealtime=1`                     |

### ID Conventions

- **Connection ID:** `efa-{lineNumber}-{originStopRefId}-{scheduledDepartureNoColons}` -- deterministic, varies by boarding station
- **Trip ID:** EFA's stateless trip identifier -- same for all stops on the same physical train run. **This is how friend matching works.**
- **Departure ID:** `dep-{stopID}-{scheduledTime}-{lineNumber}`

### Data Mapping

EFA responses are mapped in `packages/apis/vvs-efa/`:

- `connections.ts` -- `EfaTrip` -> `Connection` (identifies main leg, builds stop list, maps line types/colors)
- `departures.ts` -- `EfaDeparture` -> `Connection`
- `stations.ts` -- `EfaStopFinderPoint` -> `Station`
- Line type mapping: `"1"` = S-Bahn, `"2"/"3"` = U-Bahn, `"4"` = Tram, `"5"/"6"/"7"` = Bus, default = Regional
- Hardcoded colors for S1-S6, U1-U6, U12, U14

---

## API Endpoints

### Connections

| Route                           | Method      | Description                                                       |
| ------------------------------- | ----------- | ----------------------------------------------------------------- |
| `/api/connections/search`       | POST        | Search connections between two stations via EFA                   |
| `/api/connections/me`           | GET         | Get current user's active (not left) connections with friend data |
| `/api/connections/friends`      | POST        | Given `{ tripIds }`, returns friends on each physical train       |
| `/api/connections/[id]/friends` | GET         | Friends on a specific connection (by tripId or connection_id)     |
| `/api/connections/[id]/join`    | POST        | Join a connection (stores denormalized metadata)                  |
| `/api/connections/[id]/leave`   | POST/DELETE | Leave a connection (soft delete via `left_at`)                    |

### Stations

| Route           | Method | Description                                                     |
| --------------- | ------ | --------------------------------------------------------------- |
| `/api/stations` | GET    | Station search. `?q=` for name, `?trainOnly=true` for rail only |

### Friends

| Route                       | Method | Description                             |
| --------------------------- | ------ | --------------------------------------- |
| `/api/friends`              | GET    | List accepted friends                   |
| `/api/friends/request`      | POST   | Send friend request by email            |
| `/api/friends/requests`     | GET    | List pending requests (sent + received) |
| `/api/friends/[id]`         | DELETE | Remove a friendship                     |
| `/api/friends/[id]/accept`  | POST   | Accept a friend request                 |
| `/api/friends/[id]/decline` | POST   | Decline a friend request                |

### Favorites

| Route                 | Method | Description                                        |
| --------------------- | ------ | -------------------------------------------------- |
| `/api/favorites`      | GET    | List user's favorite routes                        |
| `/api/favorites`      | POST   | Add favorite (auto-fetches station names from EFA) |
| `/api/favorites/[id]` | DELETE | Remove a favorite                                  |

### VVS Departures

| Route                                     | Method | Description                           |
| ----------------------------------------- | ------ | ------------------------------------- |
| `/api/vvs/departures/[stationId]`         | GET    | Departures for a station (cached 30s) |
| `/api/vvs/departures/[stationId]/[limit]` | GET    | Departures with custom limit          |

---

## Server Actions

| Action           | File                     | Description                                           |
| ---------------- | ------------------------ | ----------------------------------------------------- |
| `signIn`         | `app/actions/auth.ts`    | Email/password sign-in via Supabase Auth              |
| `signUp`         | `app/actions/auth.ts`    | Registration with email, password, full name          |
| `signOut`        | `app/actions/auth.ts`    | Sign out and revalidate layout                        |
| `updateEmail`    | `app/actions/profile.ts` | Update user email                                     |
| `updatePassword` | `app/actions/profile.ts` | Update password (validates min 6 chars + confirm)     |
| `updateProfile`  | `app/actions/profile.ts` | Update full_name + avatar_url (auth + profiles table) |

---

## Hooks

### Global (`packages/apis/hooks/`)

| Hook           | Purpose                                                  | Returns             |
| -------------- | -------------------------------------------------------- | ------------------- |
| `useSession()` | Reactive Supabase auth session, listens to state changes | `{ user, loading }` |

### App-level (`app/hooks/`)

| Hook                 | Purpose                                   | Returns                                  |
| -------------------- | ----------------------------------------- | ---------------------------------------- |
| `useMyConnections()` | Fetches user's active connections via SWR | `{ connectionIds, connections, mutate }` |

### Connections page (`app/connections/hooks/`)

| Hook                       | Purpose                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| `useConnectionsPage()`     | Main orchestrator: composes search, favorites, join state, friends data |
| `useConnectionsSearch()`   | SWR connection search with "load earlier" / "load later" pagination     |
| `useFavorites()`           | Favorites CRUD with optimistic updates                                  |
| `useRouteFavoriteToggle()` | Convenience wrapper for route-level favorite toggle                     |
| `useJoinedConnectionIds()` | Returns IDs of connections the current user has joined                  |

---

## Authentication Flow

1. **Sign-up:** `/auth/signup` -> `signUp` server action -> `supabase.auth.signUp()` -> redirect to `/`
2. **Sign-in:** `/auth/signin` -> `signIn` server action -> `supabase.auth.signInWithPassword()` -> full page nav to `/`
3. **Sign-out:** UserMenu -> `signOut` server action -> `supabase.auth.signOut()` -> redirect to `/auth/signin`
4. **Session:** `useSession()` hook provides reactive auth state. localStorage backup for session resilience.
5. **Protection:** Server components check auth via `getUser()` and redirect. Client pages use `useSession()`. API routes return 401.

### Supabase Clients

- **`createServerSupabaseClient()`** -- cookie-based, respects RLS, used in server components and API routes for user-scoped queries
- **`createServiceRoleClient()`** -- bypasses RLS, used for cross-user queries (e.g., finding friends on a connection)
- **`createBrowserClient()`** -- client-side, used in `useSession()` hook

---

## Data Fetching Patterns

| Pattern                | Where Used                                             | Details                                          |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| **SWR**                | All client-side data (connections, friends, favorites) | `fetcher<T>` (GET), `postFetcher<T,B>` (POST)    |
| **Optimistic updates** | Favorites toggle                                       | `mutate(optimisticData, { revalidate: false })`  |
| **SWR Suspense**       | FavoriteConnectionsContent                             | `{ suspense: true }` with Suspense boundary      |
| **`"use cache"`**      | VVS departure API routes                               | `cacheLife({ revalidate: 30 })` (30s)            |
| **sessionStorage**     | Connection detail page                                 | Caches Connection objects for instant loads      |
| **unstable_cache**     | Supabase friend queries                                | 2min (friends list), 30s (friends on connection) |

---

## Key Design Decisions

- **No stored timetable data.** All connection info is fetched live from VVS EFA. `user_connections` stores denormalized metadata only for display purposes.
- **Friend matching by `trip_id`**, not `connection_id`. Two friends boarding the same physical train at different stations have different `connection_id`s but the same `trip_id`. The `FriendOnConnection` type extends `Friend` with the friend's boarding/alighting station names and times, so the UI can display which segment the friend shares.
- **Soft delete for leaving connections.** `left_at` timestamp is set instead of deleting the row.
- **Atomic Design for components.** Strict atoms/molecules/organisms hierarchy in `packages/ui/`.
- **SCSS Modules per component.** Each component has its own `.module.scss` file in its directory.
- **React Compiler enabled.** No manual `useMemo`/`useCallback` needed (compiler handles memoization).

---

## Environment Variables

| Variable                        | Public | Purpose                                  |
| ------------------------------- | ------ | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes    | Supabase project URL                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes    | Supabase anonymous key                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | No     | Supabase service role key (bypasses RLS) |
| `SUPABASE_PROJECT_ID`           | No     | Used by `gen-types.ts` script            |

---

## Scripts

| Command             | Description                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `bun run dev`       | Start Next.js dev server                                                 |
| `bun run build`     | Production build                                                         |
| `bun run start`     | Start production server                                                  |
| `bun run lint`      | Run ESLint                                                               |
| `bun run format`    | Run Prettier + ESLint auto-fix                                           |
| `bun run gen:types` | Generate Supabase DB types -> `packages/apis/supabase/database.types.ts` |

---

## Code Style (from CLAUDE.md)

- Always use curly braces after `if` statements
- Import types directly from React (not `React.FC`)
- Prefer arrow functions over function declarations
- Prefer `export const` over `export default` (except where Next.js requires it)
- Use `FC<PropsType>` for component typing
- Use `clsx` for conditional class names
- React Compiler is enabled -- follow its guidance for memoization (no manual memo)
