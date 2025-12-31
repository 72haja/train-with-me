/**
 * Mapping utilities to convert MobiData BW GTFS API types to app types
 */
import type { Connection, Line, Station, Stop, TransportType } from "@/packages/types/lib/types";
import type { Connection as MobidataConnection, Stop as MobidataStop } from "./types";

/**
 * Map route_type from GTFS to TransportType
 */
function mapRouteTypeToTransportType(routeType: string): TransportType {
    // GTFS Route Type values
    // 0: Tram, Streetcar, Light rail
    // 1: Subway, Metro
    // 2: Rail
    // 3: Bus
    // 109: Suburban Railway (S-Bahn)
    // 400-405: Urban Railway Service (U-Bahn, Tram)
    // 700-716: Bus Service
    // 900-906: Tram Service

    const type = parseInt(routeType, 10);

    if (type === 109 || (type >= 100 && type <= 117)) {
        return "S-Bahn";
    }
    if (type === 1 || (type >= 400 && type <= 405)) {
        return "U-Bahn";
    }
    if (type === 0 || (type >= 900 && type <= 906)) {
        return "Tram";
    }
    if (type === 3 || (type >= 700 && type <= 716)) {
        return "Bus";
    }
    if (type === 2) {
        return "Regional";
    }

    // Default fallback
    return "Bus";
}

/**
 * Get line color based on route_short_name
 */
function getLineColor(routeShortName: string): string {
    // Common VVS line colors
    const colorMap: Record<string, string> = {
        S1: "#00985f",
        S2: "#dc281e",
        S3: "#ffd500",
        S4: "#00a5e3",
        S5: "#f18700",
        S6: "#00543c",
        U1: "#3c8eda",
        U2: "#c9283e",
        U4: "#9c2a96",
        U5: "#00549f",
        U6: "#6e2585",
        U12: "#9c2a96",
        U14: "#003e7e",
    };

    return colorMap[routeShortName] || "#666666";
}

/**
 * Map MobiData Stop to app Station
 */
export function mapMobidataStopToStation(mobidataStop: MobidataStop): Station {
    return {
        id: mobidataStop.stop_id,
        name: mobidataStop.stop_name,
        city: mobidataStop.stop_desc || undefined,
        vvsId: mobidataStop.stop_code || undefined,
        locationType: mobidataStop.location_type || undefined,
        coordinates:
            mobidataStop.stop_lat && mobidataStop.stop_lon
                ? {
                      latitude: mobidataStop.stop_lat,
                      longitude: mobidataStop.stop_lon,
                  }
                : undefined,
    };
}

/**
 * Map MobiData Connection to app Connection
 * Note: This creates a simplified connection with only departure and arrival stops.
 * For full stop lists, you'd need to fetch additional trip data.
 */
export function mapMobidataConnectionToConnection(
    mobidataConnection: MobidataConnection,
    friends: Array<{ id: string; name: string; avatarUrl?: string; isOnline: boolean }> = []
): Connection {
    const transportType = mapRouteTypeToTransportType(mobidataConnection.route_type);
    const lineColor = getLineColor(mobidataConnection.route_short_name);

    const line: Line = {
        id: mobidataConnection.route_id,
        number: mobidataConnection.route_short_name,
        type: transportType,
        color: lineColor,
        direction: mobidataConnection.trip_headsign,
    };

    const departureStation: Station = {
        id: mobidataConnection.from_station_id || mobidataConnection.from_stop_id,
        name: mobidataConnection.from_station_name || mobidataConnection.from_stop_name,
        vvsId: mobidataConnection.from_stop_id,
    };

    const arrivalStation: Station = {
        id: mobidataConnection.to_station_id || mobidataConnection.to_stop_id,
        name: mobidataConnection.to_station_name || mobidataConnection.to_stop_name,
        vvsId: mobidataConnection.to_stop_id,
    };

    const departureStop: Stop = {
        station: departureStation,
        scheduledDeparture: mobidataConnection.t_departure,
        platform: mobidataConnection.from_stop_headsign || "",
    };

    const arrivalStop: Stop = {
        station: arrivalStation,
        scheduledDeparture: mobidataConnection.t_arrival,
        platform: mobidataConnection.to_stop_headsign || "",
    };

    // Create stops array with just departure and arrival
    // In a full implementation, you'd fetch all stops for the trip
    const stops: Stop[] = [departureStop, arrivalStop];

    return {
        id: mobidataConnection.connection_id,
        line,
        departure: departureStop,
        arrival: arrivalStop,
        stops,
        tripId: mobidataConnection.trip_id,
        friends: friends as Connection["friends"],
        status: "on-time", // Default, would need real-time data for actual status
        hasRealTimeData: false, // Would need to check if real-time data is available
    };
}
