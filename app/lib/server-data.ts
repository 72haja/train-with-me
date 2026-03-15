/**
 * Server-side data fetching for use in Server Components.
 */
import type { Connection } from "@/packages/types/lib/types";
import { createServerSupabaseClient } from "@apis/supabase/server";
import { searchEfaConnections } from "@apis/vvs-efa";

export type DbFavoriteConnection = {
    id: string;
    userId: string;
    originStationId: string;
    destinationStationId: string;
    originStationName?: string | null;
    destinationStationName?: string | null;
    createdAt: string;
};

/** Search connections via VVS EFA API. */
export async function getConnectionsSearch(
    originId: string,
    destinationId: string,
    date?: string,
    time?: string
): Promise<{ connections: Connection[] }> {
    const searchDateTime =
        date && time
            ? new Date(`${date}T${time}`).toISOString()
            : date
              ? new Date(date).toISOString()
              : undefined;

    const connections = await searchEfaConnections(originId, destinationId, searchDateTime);
    return { connections };
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
