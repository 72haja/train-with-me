/**
 * Type definitions for MobiData BW GTFS API
 */

/**
 * GTFS Route Type values
 * See: https://developers.google.com/transit/gtfs/reference#routestxt
 */
export type RouteType =
    | "0" // Tram, Streetcar, Light rail
    | "1" // Subway, Metro
    | "2" // Rail
    | "3" // Bus
    | "4" // Ferry
    | "5" // Cable tram
    | "6" // Aerial lift, suspended cable car
    | "7" // Funicular
    | "11" // Trolleybus
    | "12" // Monorail
    | "100" // Railway Service
    | "101" // High Speed Rail Service
    | "102" // Long Distance Trains
    | "103" // Inter Regional Rail Service
    | "104" // Car Transport Rail Service
    | "105" // Sleeper Rail Service
    | "106" // Regional Rail Service
    | "107" // Tourist Railway Service
    | "108" // Rail Shuttle (Within Complex)
    | "109" // Suburban Railway
    | "110" // Replacement Rail Service
    | "111" // Special Rail Service
    | "112" // Lorry Transport Rail Service
    | "113" // All Rail Services
    | "114" // Cross-Country Rail Service
    | "115" // Vehicle Transport Rail Service
    | "116" // Rack and Pinion Railway
    | "117" // Additional Rail Service
    | "200" // Coach Service
    | "201" // International Coach Service
    | "202" // National Coach Service
    | "203" // Shuttle Coach Service
    | "204" // Regional Coach Service
    | "205" // Special Coach Service
    | "206" // Sightseeing Coach Service
    | "207" // Tourist Coach Service
    | "208" // Commuter Coach Service
    | "209" // All Coach Services
    | "400" // Urban Railway Service
    | "401" // Metro Service
    | "402" // Underground Service
    | "403" // Tram Service
    | "404" // Light Rail Service
    | "405" // Preserved Tram Service
    | "700" // Bus Service
    | "701" // Regional Bus Service
    | "702" // Express Bus Service
    | "703" // Stopping Bus Service
    | "704" // Local Bus Service
    | "705" // Night Bus Service
    | "706" // Post Bus Service
    | "707" // Special Needs Bus
    | "708" // Mobility Bus Service
    | "709" // Mobility Bus for Registered Disabled
    | "710" // Sightseeing Bus
    | "711" // Shuttle Bus
    | "712" // School Bus
    | "713" // School and Public Service Bus
    | "714" // Rail Replacement Bus Service
    | "715" // Demand and Response Bus Service
    | "716" // All Bus Services
    | "800" // Trolleybus Service
    | "900" // Tram Service
    | "901" // City Tram Service
    | "902" // Local Tram Service
    | "903" // Regional Tram Service
    | "904" // Sightseeing Tram Service
    | "905" // Special Tram Service
    | "906" // Cable Tram
    | "1000" // Water Transport Service
    | "1100" // Air Service
    | "1200" // Ferry Service
    | "1300" // Aerial Lift Service
    | "1400" // Funicular Service
    | "1500" // Taxi Service
    | "1501" // Communal Taxi Service
    | "1502" // Water Taxi Service
    | "1503" // Rail Taxi Service
    | "1504" // Bike Taxi Service
    | "1505" // Licensed Taxi Service
    | "1506" // Private Hire Service Vehicle
    | "1507" // All Taxi Services
    | "1700" // Miscellaneous Service
    | "1701" // Cable Car
    | "1702"; // Chairlift

export type WheelchairAccessibility = "unknown" | "accessible" | "not_accessible";

export type BikesAllowance = "unknown" | "allowed" | "not_allowed";

export type PickupDropOffType = "regular" | "not_available" | "call" | "driver";

export type Timepoint = "approximate" | "exact";

/**
 * Connection represents a public transportation connection between two stops
 */
export interface Connection {
    connection_id: string;
    route_id: string;
    route_short_name: string;
    route_long_name: string;
    route_type: RouteType;
    trip_id: string;
    service_id: string;
    direction_id: number;
    trip_headsign: string;
    wheelchair_accessible: WheelchairAccessibility;
    bikes_allowed: BikesAllowance;
    trip_start_time: string; // interval
    from_stop_id: string;
    from_stop_name: string;
    from_station_id: string;
    from_station_name: string;
    from_wheelchair_boarding: string;
    from_stop_headsign: string;
    from_pickup_type: PickupDropOffType;
    t_departure: string; // timestamp with time zone
    departure_time: string; // interval
    from_stop_sequence: number;
    from_stop_sequence_consec: number;
    from_timepoint: Timepoint;
    date: string; // timestamp without time zone
    to_timepoint: Timepoint;
    to_stop_sequence: number;
    to_stop_sequence_consec: number;
    t_arrival: string; // timestamp with time zone
    arrival_time: string; // interval
    to_drop_off_type: PickupDropOffType;
    to_stop_headsign: string;
    to_stop_id: string;
    to_stop_name: string;
    to_station_id: string;
    to_station_name: string;
    to_wheelchair_boarding: string;
    frequencies_row: number;
    frequencies_it: number;
}

/**
 * Query parameters for connections endpoint
 */
export interface ConnectionsQueryParams {
    connection_id?: string;
    route_id?: string;
    from_stop_id?: string;
    to_stop_id?: string;
    from_station_id?: string;
    to_station_id?: string;
    date?: string; // Format: YYYY-MM-DD
    limit?: number;
    offset?: number;
    order?: string; // e.g., "t_departure.asc"
}

/**
 * Stop information
 */
export interface Stop {
    stop_id: string;
    stop_code?: string;
    stop_name: string;
    stop_desc?: string;
    stop_lat?: number;
    stop_lon?: number;
    zone_id?: string;
    stop_url?: string;
    location_type?: string;
    parent_station?: string;
    stop_timezone?: string;
    wheelchair_boarding?: string;
    level_id?: string;
    platform_code?: string;
}

/**
 * Route information
 */
export interface Route {
    route_id: string;
    agency_id?: string;
    route_short_name?: string;
    route_long_name?: string;
    route_desc?: string;
    route_type: RouteType;
    route_url?: string;
    route_color?: string;
    route_text_color?: string;
    route_sort_order?: number;
    continuous_pickup?: string;
    continuous_drop_off?: string;
}
