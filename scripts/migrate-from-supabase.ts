/**
 * Supabase -> Convex migration script.
 *
 * Usage:
 *   1. Make sure the following env vars are set (in `.env.local`):
 *        - NEXT_PUBLIC_SUPABASE_URL
 *        - SUPABASE_SERVICE_ROLE_KEY
 *        - NEXT_PUBLIC_CONVEX_URL
 *        - MIGRATION_SECRET              (shared secret; set via `npx convex env set MIGRATION_SECRET ...`)
 *   2. Run: `bun scripts/migrate-from-supabase.ts`
 *
 * What it does:
 *   - Fetches users, profiles, friendships, user_connections and favorite_connections from Supabase.
 *   - Uploads avatar files from Supabase Storage -> Convex file storage.
 *   - Creates matching rows in Convex. Existing rows are updated (idempotent).
 *   - Passwords are NOT migrated. Users must register again with the same email;
 *     the Convex Auth `createOrUpdateUser` callback merges the sign-up into the
 *     migrated user record so friendships and joined connections stay linked.
 */
import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const loadDotEnv = () => {
    try {
        const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");

        for (const line of raw.split("\n")) {
            const trimmed = line.trim();

            if (trimmed.length === 0 || trimmed.startsWith("#")) {
                continue;
            }

            const eqIndex = trimmed.indexOf("=");

            if (eqIndex === -1) {
                continue;
            }

            const key = trimmed.slice(0, eqIndex).trim();
            let value = trimmed.slice(eqIndex + 1).trim();

            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }

            if (process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
    } catch {
        // No .env.local - rely on whatever is already in the environment.
    }
};

loadDotEnv();

const required = (name: string): string => {
    const value = process.env[name];

    if (value === undefined || value.length === 0) {
        throw new Error(`Missing required env var: ${name}`);
    }

    return value;
};

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServiceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const convexUrl = required("NEXT_PUBLIC_CONVEX_URL");
const migrationSecret = required("MIGRATION_SECRET");

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`Service role key length: ${supabaseServiceKey.length} chars`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
        fetch: (input, init) => fetch(input as RequestInfo, init as RequestInit),
    },
});

const probeDirect = async (path: string) => {
    const url = `${supabaseUrl}${path}`;
    try {
        const res = await fetch(url, {
            headers: {
                apikey: supabaseServiceKey,
                Authorization: `Bearer ${supabaseServiceKey}`,
            },
        });
        console.log(`  [probe] ${path} -> HTTP ${res.status}`);
    } catch (err) {
        console.log(`  [probe] ${path} -> threw: ${(err as Error).message}`);
    }
};

type SupabaseUser = {
    id: string;
    email: string | undefined;
    user_metadata: {
        full_name?: string;
        avatar_url?: string;
    } | null;
};

type Profile = {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
};

type Friendship = {
    user_id: string;
    friend_id: string;
    status: "pending" | "accepted" | "blocked";
};

type UserConnection = {
    user_id: string;
    connection_id: string;
    trip_id: string | null;
    joined_at: string;
    left_at: string | null;
    origin_station_id: string | null;
    origin_station_name: string | null;
    destination_station_id: string | null;
    destination_station_name: string | null;
    departure_time: string | null;
    arrival_time: string | null;
    line_number: string | null;
    line_type: string | null;
    line_color: string | null;
    line_direction: string | null;
};

type FavoriteConnection = {
    user_id: string;
    origin_station_id: string;
    destination_station_id: string;
    origin_station_name: string | null;
    destination_station_name: string | null;
};

const toUndef = <T>(value: T | null | undefined): T | undefined =>
    value === null || value === undefined ? undefined : value;

const fetchAllAuthUsers = async (): Promise<SupabaseUser[]> => {
    const collected: SupabaseUser[] = [];
    let page = 1;

    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({
            page,
            perPage: 200,
        });

        if (error) {
            throw new Error(`Failed to list auth users: ${error.message}`);
        }

        if (data.users.length === 0) {
            break;
        }

        for (const u of data.users) {
            collected.push({
                id: u.id,
                email: u.email ?? undefined,
                user_metadata: (u.user_metadata as SupabaseUser["user_metadata"]) ?? null,
            });
        }

        if (data.users.length < 200) {
            break;
        }

        page += 1;
    }

    return collected;
};

const fetchProfiles = async (): Promise<Profile[]> => {
    const { data, error } = await supabase.from("profiles").select("*");

    if (error) {
        throw new Error(`Failed to fetch profiles: ${error.message}`);
    }

    return (data ?? []) as Profile[];
};

const fetchFriendships = async (): Promise<Friendship[]> => {
    const { data, error } = await supabase.from("friendships").select("user_id, friend_id, status");

    if (error) {
        throw new Error(`Failed to fetch friendships: ${error.message}`);
    }

    return (data ?? []) as Friendship[];
};

const fetchUserConnections = async (): Promise<UserConnection[]> => {
    const { data, error } = await supabase
        .from("user_connections")
        .select(
            "user_id, connection_id, trip_id, joined_at, left_at, origin_station_id, origin_station_name, destination_station_id, destination_station_name, departure_time, arrival_time, line_number, line_type, line_color, line_direction"
        );

    if (error) {
        throw new Error(`Failed to fetch user_connections: ${error.message}`);
    }

    return (data ?? []) as UserConnection[];
};

const fetchFavorites = async (): Promise<FavoriteConnection[]> => {
    const { data, error } = await supabase
        .from("favorite_connections")
        .select(
            "user_id, origin_station_id, destination_station_id, origin_station_name, destination_station_name"
        );

    if (error) {
        throw new Error(`Failed to fetch favorites: ${error.message}`);
    }

    return (data ?? []) as FavoriteConnection[];
};

const toAvatarPublicUrl = (raw: string | null | undefined): string | undefined => {
    if (raw === null || raw === undefined || raw.length === 0) {
        return undefined;
    }

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return raw;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(raw);
    return data.publicUrl;
};

const parseIso = (value: string | null | undefined): number | undefined => {
    if (value === null || value === undefined) {
        return undefined;
    }

    const ms = Date.parse(value);
    return Number.isNaN(ms) ? undefined : ms;
};

const main = async () => {
    console.log("Running connectivity probes...");
    await probeDirect("/rest/v1/");
    await probeDirect("/rest/v1/profiles?select=count&limit=1");
    await probeDirect("/rest/v1/favorite_connections?select=count&limit=1");

    console.log("\nFetching Supabase data (sequentially for easier debugging)...");
    const authUsers = await fetchAllAuthUsers();
    console.log(`  auth users: ${authUsers.length}`);
    const profiles = await fetchProfiles();
    console.log(`  profiles: ${profiles.length}`);
    const friendships = await fetchFriendships();
    console.log(`  friendships: ${friendships.length}`);
    const userConnections = await fetchUserConnections();
    console.log(`  user_connections: ${userConnections.length}`);
    const favorites = await fetchFavorites();
    console.log(`  favorites: ${favorites.length}`);

    const profilesById = new Map(profiles.map(p => [p.id, p]));

    const users = authUsers
        .filter(u => u.email !== undefined)
        .map(u => {
            const profile = profilesById.get(u.id);
            const fullName = profile?.full_name ?? u.user_metadata?.full_name ?? undefined;
            const avatarUrl = toAvatarPublicUrl(
                profile?.avatar_url ?? u.user_metadata?.avatar_url ?? null
            );

            return {
                supabaseId: u.id,
                email: (u.email as string).toLowerCase(),
                fullName,
                avatarUrl,
            };
        });

    const userIdSet = new Set(users.map(u => u.supabaseId));

    const friendshipsPayload = friendships
        .filter(f => userIdSet.has(f.user_id) && userIdSet.has(f.friend_id))
        .map(f => ({
            userSupabaseId: f.user_id,
            friendSupabaseId: f.friend_id,
            status: f.status,
        }));

    const userConnectionsPayload = userConnections
        .filter(c => userIdSet.has(c.user_id))
        .map(c => ({
            userSupabaseId: c.user_id,
            connectionId: c.connection_id,
            tripId: toUndef(c.trip_id),
            joinedAt: parseIso(c.joined_at) ?? Date.now(),
            leftAt: parseIso(c.left_at),
            originStationId: toUndef(c.origin_station_id),
            originStationName: toUndef(c.origin_station_name),
            destinationStationId: toUndef(c.destination_station_id),
            destinationStationName: toUndef(c.destination_station_name),
            departureTime: toUndef(c.departure_time),
            arrivalTime: toUndef(c.arrival_time),
            lineNumber: toUndef(c.line_number),
            lineType: toUndef(c.line_type),
            lineColor: toUndef(c.line_color),
            lineDirection: toUndef(c.line_direction),
        }));

    const favoritesPayload = favorites
        .filter(f => userIdSet.has(f.user_id))
        .map(f => ({
            userSupabaseId: f.user_id,
            originStationId: f.origin_station_id,
            destinationStationId: f.destination_station_id,
            originStationName: toUndef(f.origin_station_name),
            destinationStationName: toUndef(f.destination_station_name),
        }));

    console.log(
        `Dumped ${users.length} users, ${friendshipsPayload.length} friendships, ${userConnectionsPayload.length} user_connections, ${favoritesPayload.length} favorites from Supabase.`
    );

    const convex = new ConvexHttpClient(convexUrl);

    console.log("Running importAll action on Convex...");
    const { api } = await import("../convex/_generated/api.js");
    const result = (await convex.action(
        (
            api as unknown as {
                migration: {
                    importAll: unknown;
                };
            }
        ).migration.importAll as never,
        {
            secret: migrationSecret,
            users,
            friendships: friendshipsPayload,
            userConnections: userConnectionsPayload,
            favorites: favoritesPayload,
        } as never
    )) as {
        users: number;
        avatars: number;
        friendships: number;
        userConnections: number;
        favorites: number;
    };

    console.log("Migration completed:", result);
    console.log(
        "\nIMPORTANT: Passwords were not migrated. Ask users to sign up again with the same email — the Convex Auth `createOrUpdateUser` callback merges them back into the migrated records."
    );
};

main().catch(error => {
    console.error(error);
    process.exit(1);
});
