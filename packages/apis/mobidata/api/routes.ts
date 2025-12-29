/**
 * API functions for GTFS routes endpoint
 */
import { mobidataClient } from "../client";
import type { Route } from "../types";

/**
 * Get all routes or filter by parameters
 * @param params Query parameters for filtering routes
 * @returns Array of routes
 */
export const getRoutes = async (params?: {
    route_id?: string;
    route_short_name?: string;
    route_long_name?: string;
    route_type?: string;
    limit?: number;
    offset?: number;
}): Promise<Route[]> => {
    return mobidataClient<Route[]>(
        "/routes",
        "GET",
        params as Record<string, string | number | boolean | null | undefined>,
        ["routes"],
        "Error fetching routes"
    );
};

/**
 * Get a specific route by route_id
 * @param routeId The route ID
 * @returns Route or null if not found
 */
export const getRouteById = async (routeId: string): Promise<Route | null> => {
    const routes = await mobidataClient<Route[]>(
        "/routes",
        "GET",
        { route_id: routeId },
        ["routes", routeId],
        `Error fetching route ${routeId}`
    );

    return routes[0] || null;
};

