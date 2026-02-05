/**
 * Server-side data fetching for use in Server Components.
 * Reuses the same logic as API routes so we don’t duplicate.
 */
import { staticVvsMockData } from "@apis/static-vvs/data/mock-data";
import { getStaticJourneyById, searchStaticConnections } from "@apis/static-vvs/search";
import { mapJourneyToConnection } from "@apis/mobidata/mappers";
import type { Journey } from "@/app/api/connections/search/route";
import type { Connection } from "@/packages/types/lib/types";
import { createServerSupabaseClient } from "@apis/supabase/server";

export type DbFavoriteConnection = {
    id: string;
    userId: string;
    originStationId: string;
    destinationStationId: string;
    originStationName?: string | null;
    destinationStationName?: string | null;
    createdAt: string;
};

/** Search connections (static VVS). Returns connections and raw journeys. */
export async function getConnectionsSearch(
    originId: string,
    destinationId: string,
    date?: string,
    time?: string
): Promise<{ journeys: Journey[]; connections: Connection[] }> {
    const searchDate =
        date && time
            ? new Date(`${date}T${time}`).toISOString()
            : date
              ? new Date(date).toISOString()
              : undefined;
    const journeys = searchStaticConnections(
        staticVvsMockData,
        originId,
        destinationId,
        searchDate,
        20
    );
    const connections = journeys.map(j => mapJourneyToConnection(j));
    return { journeys, connections };
}

/** Get one connection by id (static or future: by id). */
export async function getConnectionById(
    connectionId: string
): Promise<{ connection: Connection; userConnectionId: string | null } | null> {
    if (connectionId.startsWith("static-")) {
        const datePart = new Date().toISOString().slice(0, 10);
        const journey = getStaticJourneyById(staticVvsMockData, connectionId, datePart);
        if (!journey) return null;
        const connection = mapJourneyToConnection(journey);
        return { connection, userConnectionId: null };
    }
    // Non-static: could call API or DB here
    return null;
}

/** Get favorites for the current user (server-side, uses cookies). */
export async function getFavorites(): Promise<DbFavoriteConnection[]> {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return [];
    const { data, error } = await supabase
        .from("favorite_connections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
    if (error) return [];
    return (data || []).map(fav => ({
        id: fav.id,
        userId: fav.user_id,
        originStationId: fav.origin_station_id,
        destinationStationId: fav.destination_station_id,
        originStationName: fav.origin_station_name,
        destinationStationName: fav.destination_station_name,
        createdAt: fav.created_at,
    }));
}
