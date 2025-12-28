/**
 * Connection types
 * Types for train/bus connections and journeys
 */

import type { Friend } from "./friend";
import type { Line } from "./transport";
import type { Stop } from "./stop";
import type { TransportType } from "./transport";

export interface Connection {
    id: string;
    line: Line;
    /** Departure stop */
    departure: Stop;
    /** Arrival stop */
    arrival: Stop;
    /** All stops on this connection */
    stops: Stop[];
    /** Trip/journey ID from VVS API */
    tripId: string;
    /** Friends currently on this connection */
    friends: Friend[];
    /** Connection status */
    status: "on-time" | "delayed" | "cancelled";
    /** Real-time updates available */
    hasRealTimeData: boolean;
}

export interface ConnectionSearchParams {
    /** Origin station VVS ID */
    originId: string;
    /** Destination station VVS ID (optional for "all departures") */
    destinationId?: string;
    /** Departure time (ISO 8601) */
    departureTime: string;
    /** Include only specific transport types */
    transportTypes?: TransportType[];
}

