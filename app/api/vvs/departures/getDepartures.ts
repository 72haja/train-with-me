/**
 * Shared function to fetch departures from a VVS station
 * 
 * This function is cached per stationId and limit combination for 30 seconds.
 * Results are cached using Next.js Cache Components.
 */
import { cacheLife } from "next/cache";
import { mockConnections } from "@apis/mockData";

// import { fetchDeparturesFromVVS } from '@/packages/apis/vvs/api';
// import { getFriendsOnConnection } from '@/packages/apis/supabase/queries';

export async function getDepartures(stationId: string, limit: number) {
    "use cache";
    // Cache for 30 seconds (departures change frequently)
    // Cache key includes both stationId and limit for proper cache isolation
    cacheLife({ revalidate: 30 });

    // For now, return mock data
    const connections = mockConnections.slice(0, limit);

    return {
        success: true,
        data: connections,
        meta: {
            stationId,
            count: connections.length,
            timestamp: new Date().toISOString(),
        },
    };
}

