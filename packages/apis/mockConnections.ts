/**
 * Mock Connection Search
 * This will be replaced with actual VVS API calls when the API is integrated
 */

import type { Connection } from "@/types/vvs";
import { mockConnections } from "./mockData";
import { findStationById } from "./mockStations";

/**
 * Search connections by origin and destination
 * This is a mock implementation that filters existing connections
 */
export function searchConnections(
    originId: string,
    destinationId: string
): Connection[] {
    const originStation = findStationById(originId);
    const destinationStation = findStationById(destinationId);

    if (!originStation || !destinationStation) {
        return [];
    }

    // Filter connections that pass through both stations
    // In a real implementation, this would call the VVS API
    const filtered = mockConnections.filter((connection) => {
        const hasOrigin = connection.stops.some(
            (stop) => stop.station.id === originId
        );
        const hasDestination = connection.stops.some(
            (stop) => stop.station.id === destinationId
        );

        if (!hasOrigin || !hasDestination) {
            return false;
        }

        // Check if origin comes before destination
        const originIndex = connection.stops.findIndex(
            (stop) => stop.station.id === originId
        );
        const destinationIndex = connection.stops.findIndex(
            (stop) => stop.station.id === destinationId
        );

        return originIndex < destinationIndex;
    });

    // If no direct connections found, return connections from origin
    // (simulating a real API that might return partial results)
    if (filtered.length === 0) {
        return mockConnections.filter((connection) =>
            connection.stops.some((stop) => stop.station.id === originId)
        );
    }

    return filtered;
}

