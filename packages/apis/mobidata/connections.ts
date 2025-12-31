/**
 * Connection search using MobiData BW API
 */
import { format } from "date-fns";
import type { Connection } from "@/packages/types/lib/types";
import { PostgrestFilters } from "@apis/mobidata/postgrest";
import { getConnections } from "./api/connections";
import { getStops } from "./api/stops";
import { mapMobidataConnectionToConnection } from "./mappers";
import type { ConnectionsQueryParams, Connection as MobidataConnection } from "./types";

/**
 * Search connections by origin and destination
 *
 * Strategy: The connections endpoint works with stop IDs, not station IDs.
 * The endpoint returns connections between consecutive stops, not full journeys.
 * We need to:
 * 1. Get all stops for origin station
 * 2. Query connections from each stop (using from_stop_id)
 * 3. Filter by trips that go to destination (using trip_headsign or by finding connections that end at destination)
 * 4. For trips going to destination, find the connection segment that actually ends at destination station
 * 5. Filter by date/time client-side
 */
export async function searchConnections(
    originId: string,
    destinationId: string,
    date?: string
): Promise<Connection[]> {
    try {
        // Step 1: Get all stops for the origin station
        const originStops = await getStops({
            parent_station: PostgrestFilters.eq(originId),
        });

        if (originStops.length === 0) {
            return [];
        }

        // Step 2: Query connections from origin stops
        // The API has severe memory limits, so we use conservative querying
        // Only query the first stop, but with enough limit to find trips going to destination
        const allOriginConnections: MobidataConnection[] = [];
        const stopsToQuery = originStops.slice(0, 1); // Only query first stop to reduce load

        // Helper function to retry with exponential backoff
        const retryWithBackoff = async (
            fn: () => Promise<MobidataConnection[]>,
            maxRetries: number = 2,
            initialDelay: number = 500
        ): Promise<MobidataConnection[]> => {
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    return await fn();
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    const is503 =
                        errorMessage.includes("503") ||
                        errorMessage.includes("Service Unavailable");

                    if (is503 && attempt < maxRetries - 1) {
                        // Exponential backoff: 500ms, 1000ms
                        const delay = initialDelay * Math.pow(2, attempt);
                        console.warn(
                            `API unavailable, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
                        );
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw error;
                }
            }
            throw new Error("Max retries exceeded");
        };

        for (const stop of stopsToQuery) {
            try {
                // Try with a reasonable limit to find trips going to destination
                const connections = await retryWithBackoff(async () => {
                    return await getConnections({
                        from_stop_id: PostgrestFilters.eq(stop.stop_id),
                        limit: 15, // Increased to find trips going to destination
                    });
                });

                allOriginConnections.push(...connections);
            } catch (error) {
                // Handle errors gracefully - if API is down, we can't do much
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(
                    `Failed to fetch connections from stop ${stop.stop_id}:`,
                    errorMessage
                );
                // Continue to next stop or return empty if this was the only stop
                continue;
            }
        }

        if (allOriginConnections.length === 0) {
            return [];
        }

        // Step 4: Find trips that go to destination
        // First, find connections that directly end at destination
        const directConnections = allOriginConnections.filter(
            conn => conn.to_station_id === destinationId
        );

        // Also find trips that have connections ending at destination
        // (in case the direct connection isn't in our initial fetch)
        const tripsToDestination = new Set<string>();

        // Add trips from direct connections
        for (const conn of directConnections) {
            tripsToDestination.add(conn.trip_id);
        }

        // Find all trips that have connections ending at destination
        for (const conn of allOriginConnections) {
            // If connection ends at destination, add its trip
            if (conn.to_station_id === destinationId) {
                tripsToDestination.add(conn.trip_id);
            }
        }

        // Step 5: For trips going to destination, find all connections that end at destination
        const matchingConnections: MobidataConnection[] = [];

        // First, add direct connections
        matchingConnections.push(...directConnections);

        // Then, for trips we identified, find connections ending at destination
        for (const tripId of tripsToDestination) {
            const tripConnections = allOriginConnections.filter(c => c.trip_id === tripId);
            // Find connections in this trip that end at destination
            const destinationConns = tripConnections.filter(c => c.to_station_id === destinationId);
            matchingConnections.push(...destinationConns);
        }

        // Remove duplicates (same connection_id)
        const allConnections = Array.from(
            new Map(matchingConnections.map(conn => [conn.connection_id, conn])).values()
        );

        // Remove duplicates (same connection_id)
        const uniqueConnections = Array.from(
            new Map(allConnections.map(conn => [conn.connection_id, conn])).values()
        );

        // Step 5: Filter by date and time if provided
        let filteredConnections = uniqueConnections;

        if (date) {
            const newDate = new Date(date);
            if (newDate && !isNaN(newDate.getTime())) {
                // Format date as YYYY-MM-DD for comparison
                const targetDateStr = format(newDate, "yyyy-MM-dd");

                // Format time as HH:MM:SS for comparison
                const hours = String(newDate.getHours()).padStart(2, "0");
                const minutes = String(newDate.getMinutes()).padStart(2, "0");
                const seconds = String(newDate.getSeconds()).padStart(2, "0");
                const timeStr = `${hours}:${minutes}:${seconds}`;

                filteredConnections = uniqueConnections.filter(conn => {
                    // Extract date from connection (format: "2025-10-13T00:00:00" or "2025-10-13")
                    const connDateStr = conn.date.split("T")[0];

                    // Check if date matches
                    if (connDateStr !== targetDateStr) {
                        return false;
                    }

                    // If date matches, check time
                    return conn.departure_time >= timeStr;
                });
            }
        }

        // Step 6: Sort by departure time and limit results
        filteredConnections.sort((a, b) => {
            const timeA = a.departure_time;
            const timeB = b.departure_time;
            return timeA.localeCompare(timeB);
        });

        const limitedConnections = filteredConnections.slice(0, 5);

        // Map to app Connection type
        return limitedConnections.map(conn => mapMobidataConnectionToConnection(conn));
    } catch (error) {
        console.error("Error searching connections:", error);
        return [];
    }
}

/**
 * Get departures from a specific station
 */
export async function getDeparturesFromStation(
    stationId: string,
    limit: number = 10,
    date?: string
): Promise<Connection[]> {
    try {
        const params: ConnectionsQueryParams = {
            from_station_id: stationId,
            order: "t_departure.asc",
            limit,
        };

        if (date) {
            const dateStr = typeof date === "string" ? date.split("T")[0] : date;
            params.date = dateStr;
        }

        const mobidataConnections = await getConnections(params);

        return mobidataConnections.map(conn => mapMobidataConnectionToConnection(conn));
    } catch (error) {
        console.error("Error fetching departures:", error);
        return [];
    }
}
