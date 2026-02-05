/**
 * API functions for GTFS connections endpoint
 */
import { mobidataClient } from "@apis/mobidata/client";
import type { Connection, ConnectionsQueryParams } from "@apis/mobidata/types";

/**
 * Get connections between stops
 * @param params Query parameters for filtering connections
 * @returns Array of connections
 */
export const getConnections = async (params?: ConnectionsQueryParams): Promise<Connection[]> => {
    return mobidataClient<Connection[]>(
        "/connections",
        "GET",
        params as Record<string, string | number | boolean | null | undefined>,
        ["connections"],
        "Error fetching connections"
    );
};

/**
 * Get a specific connection by connection_id
 * @param connectionId The connection ID
 * @returns Connection or null if not found
 */
export const getConnectionById = async (connectionId: string): Promise<Connection | null> => {
    const connections = await mobidataClient<Connection[]>(
        "/connections",
        "GET",
        { connection_id: connectionId },
        ["connections", connectionId],
        `Error fetching connection ${connectionId}`
    );

    return connections[0] || null;
};

/**
 * Get all connections for a specific trip
 * @param tripId The trip ID
 * @param date Optional date filter (YYYY-MM-DD)
 * @returns Array of connections for the trip, ordered by stop sequence
 */
export const getConnectionsByTripId = async (
    tripId: string,
    date?: string
): Promise<Connection[]> => {
    const params: ConnectionsQueryParams = {
        trip_id: tripId,
        limit: 200, // Trips can have many stops
    };

    if (date) {
        params.date = date;
    }

    const connections = await mobidataClient<Connection[]>(
        "/connections",
        "GET",
        params as Record<string, string | number | boolean | null | undefined>,
        ["connections", "trip", tripId],
        `Error fetching connections for trip ${tripId}`
    );

    // Sort by stop sequence
    return connections.sort((a, b) => a.from_stop_sequence - b.from_stop_sequence);
};
