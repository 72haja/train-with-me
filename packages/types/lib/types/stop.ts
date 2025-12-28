/**
 * Stop types
 * Types for train/bus stops with timing information
 */

import type { Station } from "./station";

export interface Stop {
    station: Station;
    /** Scheduled departure time in ISO 8601 format */
    scheduledDeparture: string;
    /** Actual departure time (if available) */
    actualDeparture?: string;
    /** Delay in minutes (can be negative for early departures) */
    delay?: number;
    platform: string;
    /** Track/platform changes */
    platformChange?: boolean;
}

