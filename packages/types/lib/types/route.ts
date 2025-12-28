/**
 * Route-related types
 * Types for displaying route information and stops
 */

export interface RouteStation {
    id: string;
    name: string;
}

export interface RouteStop {
    station: RouteStation;
    scheduledDeparture: string;
}
