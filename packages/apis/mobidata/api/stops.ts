/**
 * API functions for GTFS stops endpoint
 */
import { mobidataClient } from "../client";
import type { Stop } from "../types";

/**
 * Get all stops or filter by parameters
 * @param params Query parameters for filtering stops
 * @returns Array of stops
 */
export const getStops = async (params?: {
    stop_id?: string;
    stop_name?: string;
    limit?: number;
    offset?: number;
}): Promise<Stop[]> => {
    return mobidataClient<Stop[]>(
        "/stops",
        "GET",
        params as Record<string, string | number | boolean | null | undefined>,
        ["stops"],
        "Error fetching stops"
    );
};

/**
 * Get a specific stop by stop_id
 * @param stopId The stop ID
 * @returns Stop or null if not found
 */
export const getStopById = async (stopId: string): Promise<Stop | null> => {
    const stops = await mobidataClient<Stop[]>(
        "/stops",
        "GET",
        { stop_id: stopId },
        ["stops", stopId],
        `Error fetching stop ${stopId}`
    );

    return stops[0] || null;
};

