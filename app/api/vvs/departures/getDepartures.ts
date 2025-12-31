/**
 * Shared function to fetch departures from a VVS station
 *
 * This function is cached per stationId and limit combination for 30 seconds.
 * Results are cached using Next.js Cache Components.
 */
import { cacheLife } from "next/cache";
import { getDeparturesFromStation } from "@apis/mobidata";

export async function getDepartures(stationId: string, limit: number) {
    "use cache";
    // Cache for 30 seconds (departures change frequently)
    // Cache key includes both stationId and limit for proper cache isolation
    cacheLife({ revalidate: 30 });

    try {
        const connections = await getDeparturesFromStation(stationId, limit);

        return {
            success: true,
            data: connections,
            meta: {
                stationId,
                count: connections.length,
                timestamp: new Date().toISOString(),
            },
        };
    } catch (error) {
        console.error("Error fetching departures:", error);
        return {
            success: false,
            data: [],
            meta: {
                stationId,
                count: 0,
                timestamp: new Date().toISOString(),
            },
        };
    }
}
