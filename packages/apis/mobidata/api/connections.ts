/**
 * API functions for GTFS connections endpoint
 */
import { mobidataClient } from "../client";
import type { Connection, ConnectionsQueryParams } from "../types";

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

