/**
 * API functions for GTFS stops endpoint
 */
import { mobidataClient } from "@apis/mobidata/client";
import type { Stop } from "@apis/mobidata/types";

/**
 * Query parameters for stops endpoint
 * String filter fields must use PostgREST operators (e.g., "eq.station", "like.John*")
 * Use PostgrestFilters helper functions to create filter values
 */
export interface StopsQueryParams {
    stop_id?: string | `${string}.${string}`; // Can be plain string or PostgREST filter
    stop_name?: string | `${string}.${string}`; // Can be plain string or PostgREST filter (use "like" or "ilike" for search)
    parent_station?: string | `${string}.${string}`; // Can be plain string or PostgREST filter
    limit?: number;
    offset?: number;
    location_type?: string | `${string}.${string}`; // Must use PostgREST filter (e.g., "eq.station")
}

/**
 * Get all stops or filter by parameters
 * @param params Query parameters for filtering stops
 * @returns Array of stops
 *
 * @example
 * // Get all stations
 * getStops({ location_type: "eq.station", limit: 50 })
 *
 * @example
 * // Search stations by name (case-insensitive)
 * getStops({ stop_name: "ilike.*Hauptbahnhof*", location_type: "eq.station" })
 */
export const getStops = async (params?: StopsQueryParams): Promise<Stop[]> => {
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
