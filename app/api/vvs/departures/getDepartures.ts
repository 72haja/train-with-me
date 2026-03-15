/**
 * Shared function to fetch departures from a VVS station
 *
 * Uses VVS EFA API.
 * Results are cached using Next.js Cache Components for 30 seconds.
 */
import { cacheLife } from "next/cache";
import { getEfaDepartures } from "@apis/vvs-efa";

export async function getDepartures(stationId: string, limit: number) {
    "use cache";
    cacheLife({ revalidate: 30 });

    try {
        const connections = await getEfaDepartures(stationId, limit);

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
