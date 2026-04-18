# Project Spec -- VVS Together (train-with-me)

## Purpose

VVS Together is a web-based transit companion app for the Stuttgart metropolitan area (VVS region). It lets users search public transport connections, join specific trains, and see which friends are on the same journey. The core workflow: search a route, pick a connection, join it, and coordinate with friends who joined the same physical train.

No timetable data is stored long-term. All connection data is fetched live from the public VVS EFA API.

---

## Tech Stack

| Layer         | Technology                                                              |
| ------------- | ----------------------------------------------------------------------- |
| Framework     | Next.js 16.2.4 (App Router)                                             |
| Language      | TypeScript 5.9                                                          |
| Runtime       | Bun                                                                     |
| React         | React 19.2 with React Compiler enabled                                  |
| Database      | Convex (reactive document store)                                        |
| Auth          | Convex Auth (`@convex-dev/auth` Password provider)                      |
| File Storage  | Convex file storage (avatars)                                           |
| Transit Data  | VVS EFA public API (no auth required)                                   |
| Styling       | SCSS Modules (per-component), Tailwind CSS classes                      |
| Animations    | motion (Framer Motion v12)                                              |
| Data Fetching | Convex hooks (`useQuery`, `useMutation`, `useAction`) + SWR (EFA proxy) |
| Icons         | lucide-react                                                            |
| Linting       | @becklyn/eslint, @becklyn/prettier, @becklyn/tsconfig                   |

---

## Project Structure

```
train-with-me/
  app/                        # Next.js App Router
    api/                      # API route handlers (EFA proxies only)
      connections/search/     # Live connection search via EFA
      stations/               # Station search via EFA
      vvs/departures/         # Departure monitor (cached)
    auth/                     # Sign-in / Sign-up pages
    components/               # Page-level client components (forms, profile)
    connections/              # Connections search results + detail pages
      [id]/                   # Single connection detail
      hooks/                  # Page-specific hooks (search, favorites, join)
    friends/                  # Friends list page
    hooks/                    # App-level hooks (useMyConnections)
    lib/                      # Utilities (fetcher, server-data helpers)
    profile/                  # User profile page
    ConvexClientProvider.tsx  # Client-side ConvexAuthNextjsProvider wrapper
    layout.tsx                # Root layout (Geist fonts + ConvexAuthNextjsServerProvider)
    page.tsx                  # Home page (redirects if unauthenticated)
    globals.scss              # Global styles and design tokens

  convex/                     # Convex backend
    _generated/               # Auto-generated types (do not edit)
    auth.config.ts            # JWT provider config for Convex Auth
    auth.ts                   # convexAuth() setup with Password provider + createOrUpdateUser callback
    http.ts                   # HTTP routes for auth callbacks
    schema.ts                 # Data model (users + authTables, friendships, userConnections, favoriteConnections)
    users.ts                  # Current user queries, profile + avatar mutations
    friendships.ts            # Friends list/requests + accept/decline/remove mutations
    userConnections.ts        # Join/leave/list + friends-on-trip queries
    favorites.ts              # Favorites list/add (action -> EFA for station names)/remove
    migration.ts              # Supabase -> Convex bulk import action

  middleware.ts               # Convex Auth Next.js middleware (protects pages, redirects unauth users)

  packages/
    apis/                     # API clients and data access
      hooks/                  # useSession (Convex-backed)
      vvs-efa/                # VVS EFA API client, mappers, types
      mockStations.ts         # Fallback station data
    types/                    # Shared TypeScript type definitions
      lib/types/              # Connection, Station, Friend types
    ui/                       # Component library (Atomic Design)
      atoms/                  # Button, Input, Autocomplete, LineBadge, LoadingSpinner, etc.
      molecules/              # ConnectionCard, RouteSearchForm, StationAutocomplete, etc.
      organisms/              # HomeScreen, TrainDetailsScreen, AuthScreen

  scripts/
    migrate-from-supabase.ts  # One-off migration script: Supabase -> Convex
```

### Path Aliases (tsconfig)

| Alias     | Maps to                               |
| --------- | ------------------------------------- |
| `@/*`     | `./*` (project root)                  |
| `@ui/*`   | `./packages/ui/*`                     |
| `@apis/*` | `./packages/apis/*`                   |
| `@types`  | `./packages/types/lib/types/index.ts` |

---

## Data Model (Convex)

Defined in `convex/schema.ts`. Types are auto-generated into `convex/_generated/dataModel.d.ts`. Row IDs are `Id<"tableName">` (opaque Convex IDs, not uuid).

### `users` (extends `authTables.users`)

Merged with the schema from `@convex-dev/auth/server`. Added fields:

| Field             | Type              | Notes                                 |
| ----------------- | ----------------- | ------------------------------------- |
| `email`           | string?           | Lowercased; unique via `email` index. |
| `name`            | string?           | Populated by Convex Auth.             |
| `image`           | string?           | Not used by the app.                  |
| `fullName`        | string?           | App-facing display name.              |
| `avatarStorageId` | `Id<"_storage">`? | Convex file-storage ID for avatar.    |

Indexes: `email`.

### `friendships`

Bidirectional friend relationships with status lifecycle: pending -> accepted. Each relationship is one row (the requester is `userId`, the recipient is `friendId`).

| Field      | Type                                   |
| ---------- | -------------------------------------- |
| `userId`   | `Id<"users">`                          |
| `friendId` | `Id<"users">`                          |
| `status`   | `"pending" \| "accepted" \| "blocked"` |

Indexes: `by_user`, `by_friend`, `by_user_and_friend`, `by_friend_and_user`, `by_user_and_status`, `by_friend_and_status`.

### `userConnections`

Tracks which users have joined which train connections. Soft-delete via `leftAt` (epoch ms, undefined = active).

| Field                    | Type          |
| ------------------------ | ------------- |
| `userId`                 | `Id<"users">` |
| `connectionId`           | string        |
| `tripId`                 | string? (EFA) |
| `joinedAt`               | number (ms)   |
| `leftAt`                 | number? (ms)  |
| `originStationId`        | string?       |
| `originStationName`      | string?       |
| `destinationStationId`   | string?       |
| `destinationStationName` | string?       |
| `departureTime`          | string? (ISO) |
| `arrivalTime`            | string? (ISO) |
| `lineNumber`             | string?       |
| `lineType`               | string?       |
| `lineColor`              | string?       |
| `lineDirection`          | string?       |

Indexes: `by_user`, `by_user_and_connection`, `by_user_and_left`, `by_trip`.

### `favoriteConnections`

Saved origin-destination pairs for quick access.

| Field                    | Type          |
| ------------------------ | ------------- |
| `userId`                 | `Id<"users">` |
| `originStationId`        | string        |
| `destinationStationId`   | string        |
| `originStationName`      | string?       |
| `destinationStationName` | string?       |

Indexes: `by_user`, `by_user_and_route`.

### File Storage

- Avatars live in Convex file storage, referenced by `users.avatarStorageId`. The public URL is resolved server-side via `ctx.storage.getUrl()` inside `users.getCurrentUser` and related queries.

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

## Convex Functions

All function references are `api.<file>.<name>` (or `internal.<file>.<name>`) as generated in `convex/_generated/api.d.ts`.

### Users (`convex/users.ts`)

| Name                      | Kind     | Description                                                   |
| ------------------------- | -------- | ------------------------------------------------------------- |
| `getCurrentUser`          | query    | Returns the current user with resolved avatar URL, or `null`. |
| `getById`                 | query    | Look up any user by `Id<"users">` (auth-required).            |
| `updateProfile`           | mutation | Patch `fullName` on the current user.                         |
| `generateAvatarUploadUrl` | mutation | Returns a one-time upload URL for Convex file storage.        |
| `setAvatar`               | mutation | Attaches an uploaded `Id<"_storage">` to the current user.    |
| `removeAvatar`            | mutation | Deletes the current avatar file and clears `avatarStorageId`. |
| `findByEmail`             | query    | Lookup by email (used for friend search).                     |

### Friendships (`convex/friendships.ts`)

| Name             | Kind     | Description                                              |
| ---------------- | -------- | -------------------------------------------------------- |
| `list`           | query    | Accepted friends of the current user (with avatar URLs). |
| `listRequests`   | query    | `{ received, sent }` pending friend requests.            |
| `sendRequest`    | mutation | Send a friend request by email.                          |
| `acceptRequest`  | mutation | Accept a pending request (must be the recipient).        |
| `declineRequest` | mutation | Decline a pending request (deletes the row).             |
| `remove`         | mutation | Remove an accepted friendship (either side can remove).  |

### User connections (`convex/userConnections.ts`)

| Name                  | Kind     | Description                                                                            |
| --------------------- | -------- | -------------------------------------------------------------------------------------- |
| `listMine`            | query    | Active connections for the current user + friends-on-trip data.                        |
| `friendsOnTrips`      | query    | Given `tripIds[]`, returns `Record<tripId, Friend[]>`.                                 |
| `friendsOnConnection` | query    | Given a connection + optional `tripId`, returns the current user's friends on it.      |
| `join`                | mutation | Join a connection; stores denormalized metadata.                                       |
| `leave`               | mutation | Soft-delete via `leftAt`.                                                              |
| `cleanupPast`         | mutation | Soft-deletes the current user's active connections whose arrival/departure is in past. |

### Favorites (`convex/favorites.ts`)

| Name             | Kind             | Description                                                                   |
| ---------------- | ---------------- | ----------------------------------------------------------------------------- |
| `list`           | query            | Favorites for the current user, newest first.                                 |
| `add`            | action           | Fetches station names from EFA, then inserts via `internal.favorites.insert`. |
| `removeFavorite` | mutation         | Delete a favorite owned by the current user.                                  |
| `findExisting`   | internalQuery    | Duplicate check used by `add`.                                                |
| `insert`         | internalMutation | Raw insert used by `add`.                                                     |

### Migration (`convex/migration.ts`)

| Name                   | Kind             | Description                                                                                   |
| ---------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `importAll`            | action           | Public import entry point, guarded by `MIGRATION_SECRET` env var. Consumed by the Bun script. |
| `upsertMigratedUser`   | internalMutation | Creates or email-matches a migrated user record.                                              |
| `importAvatar`         | internalAction   | Downloads an avatar URL and attaches the resulting storage ID to a user.                      |
| `attachAvatar`         | internalMutation | Patches `avatarStorageId` on a user.                                                          |
| `upsertFriendship`     | internalMutation | Idempotent friendship import (checks both directions).                                        |
| `upsertUserConnection` | internalMutation | Idempotent joined-connection import (keyed by `userId + connectionId`).                       |
| `upsertFavorite`       | internalMutation | Idempotent favorite import (keyed by `userId + originStationId + destinationStationId`).      |

---

## Remaining HTTP API Endpoints

Only EFA proxies remain -- all database operations moved to Convex.

### Connections

| Route                     | Method | Description                                      |
| ------------------------- | ------ | ------------------------------------------------ |
| `/api/connections/search` | POST   | Search connections between two stations via EFA. |

### Stations

| Route           | Method | Description                                                     |
| --------------- | ------ | --------------------------------------------------------------- |
| `/api/stations` | GET    | Station search. `?q=` for name, `?trainOnly=true` for rail only |

### VVS Departures

| Route                                     | Method | Description                           |
| ----------------------------------------- | ------ | ------------------------------------- |
| `/api/vvs/departures/[stationId]`         | GET    | Departures for a station (cached 30s) |
| `/api/vvs/departures/[stationId]/[limit]` | GET    | Departures with custom limit          |

---

## Hooks

### Global (`packages/apis/hooks/`)

| Hook           | Purpose                                                   | Returns                              |
| -------------- | --------------------------------------------------------- | ------------------------------------ |
| `useSession()` | Reactive Convex auth state + current-user document merge. | `{ user, loading, isAuthenticated }` |

### App-level (`app/hooks/`)

| Hook                 | Purpose                                        | Returns                          |
| -------------------- | ---------------------------------------------- | -------------------------------- |
| `useMyConnections()` | Wrapper around `api.userConnections.listMine`. | `{ connectionIds, connections }` |

### Connections page (`app/connections/hooks/`)

| Hook                       | Purpose                                                                       |
| -------------------------- | ----------------------------------------------------------------------------- |
| `useConnectionsPage()`     | Composes EFA search, Convex favorites, joined-ID set, `friendsOnTrips` query. |
| `useConnectionsSearch()`   | SWR connection search with "load earlier" / "load later" pagination (EFA).    |
| `useFavorites()`           | Convex-backed favorites read + `add` action / `removeFavorite` mutation.      |
| `useRouteFavoriteToggle()` | Convenience wrapper for route-level favorite toggle.                          |
| `useJoinedConnectionIds()` | Shortcut over `useMyConnections().connectionIds`.                             |

---

## Authentication Flow

1. **Sign-up:** `/auth/signup` -> `useAuthActions().signIn("password", { flow: "signUp", email, password, fullName })` -> Password provider stores hash in `authAccounts`, `createOrUpdateUser` callback creates the `users` row (or merges with a migrated record).
2. **Sign-in:** `/auth/signin` -> `useAuthActions().signIn("password", { flow: "signIn", email, password })` -> sets auth cookies -> full-page nav to `/`.
3. **Sign-out:** UserMenu -> `useAuthActions().signOut()` -> redirect to `/auth/signin`.
4. **Session:** `useSession()` reads `useConvexAuth()` + `api.users.getCurrentUser`. The `middleware.ts` file redirects unauthenticated users away from protected routes and signed-in users away from `/auth/*`.
5. **Server-side auth:** `isAuthenticatedNextjs()` from `@convex-dev/auth/nextjs/server` gates Server Components; `convexAuthNextjsToken()` is called to keep rendered pages user-scoped.

### Migration merging

`convexAuth()` in `convex/auth.ts` ships a `callbacks.createOrUpdateUser` that looks up existing users by email before creating a new row. This lets the Supabase -> Convex migration seed `users` rows without authAccounts; the first sign-up with a matching email adopts the existing `_id`, preserving friendships/joined-connection links.

---

## Data Fetching Patterns

| Pattern                       | Where Used                                           | Details                                        |
| ----------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| **`useQuery` (Convex)**       | Friends, favorites, joined connections, current user | Reactive, auto-revalidating subscriptions.     |
| **`useMutation`/`useAction`** | All writes + external-fetch actions                  | Direct calls; no SWR layer for DB ops.         |
| **SWR**                       | EFA connection search and detail pages only          | `fetcher<T>` (GET), `postFetcher<T,B>` (POST). |
| **SWR Suspense**              | FavoriteConnectionsContent                           | `{ suspense: true }` with Suspense boundary.   |
| **`"use cache"`**             | VVS departure API routes                             | `cacheLife({ revalidate: 30 })` (30s).         |
| **sessionStorage**            | Connection detail page                               | Caches Connection objects for instant loads.   |

---

## Key Design Decisions

- **No stored timetable data.** All connection info is fetched live from VVS EFA. `userConnections` stores denormalized metadata only for display purposes.
- **Friend matching by `tripId`**, not `connectionId`. Two friends boarding the same physical train at different stations have different `connectionId`s but the same `tripId`.
- **Soft delete for leaving connections.** `leftAt` timestamp (epoch ms) is set instead of deleting the row.
- **Past-connection cleanup.** A `cleanupPast` mutation the client can call opportunistically sets `leftAt` on active rows whose arrival/departure time is in the past.
- **Atomic Design for components.** Strict atoms/molecules/organisms hierarchy in `packages/ui/`.
- **SCSS Modules per component.** Each component has its own `.module.scss` file in its directory.
- **React Compiler enabled.** No manual `useMemo`/`useCallback` needed (compiler handles memoization).
- **Password resets & email changes are not yet wired up.** The Convex Auth Password provider supports email-based reset flows but requires an outbound email provider -- out of scope for the initial migration. Profile UI only exposes avatar + full-name edits.

---

## Environment Variables

| Variable                    | Public | Where set    | Purpose                                           |
| --------------------------- | ------ | ------------ | ------------------------------------------------- |
| `NEXT_PUBLIC_CONVEX_URL`    | Yes    | `.env.local` | Convex deployment URL used by the browser client. |
| `CONVEX_DEPLOYMENT`         | No     | `.env.local` | Convex deployment selector for the CLI.           |
| `SITE_URL`                  | No     | Convex env   | Configured by `@convex-dev/auth` setup.           |
| `JWT_PRIVATE_KEY`           | No     | Convex env   | Signs Convex Auth JWTs. Rotated via the CLI.      |
| `JWKS`                      | No     | Convex env   | Public JWKS for Convex Auth token verification.   |
| `MIGRATION_SECRET`          | No     | Convex env   | Shared secret gating the `importAll` action.      |
| `NEXT_PUBLIC_SUPABASE_URL`  | Yes    | `.env.local` | **Only** used by the one-off migration script.    |
| `SUPABASE_SERVICE_ROLE_KEY` | No     | `.env.local` | **Only** used by the one-off migration script.    |

---

## Scripts

| Command                    | Description                                                                    |
| -------------------------- | ------------------------------------------------------------------------------ |
| `bun run dev`              | Start Next.js dev server. Run `npx convex dev` separately to watch Convex.     |
| `bun run build`            | Production build.                                                              |
| `bun run start`            | Start production server.                                                       |
| `bun run lint`             | Run ESLint.                                                                    |
| `bun run format`           | Run Prettier + ESLint auto-fix.                                                |
| `bun run migrate:supabase` | One-off Supabase -> Convex migration (see `scripts/migrate-from-supabase.ts`). |

---

## Code Style (from CLAUDE.md)

- Always use curly braces after `if` statements
- Import types directly from React (not `React.FC`)
- Prefer arrow functions over function declarations
- Prefer `export const` over `export default` (except where Next.js requires it)
- Use `FC<PropsType>` for component typing
- Use `clsx` for conditional class names
- React Compiler is enabled -- follow its guidance for memoization (no manual memo)
