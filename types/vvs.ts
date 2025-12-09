/**
 * VVS & Deutsche Bahn Data Types
 * These types match the expected API responses from VVS and DB APIs
 */

export type TransportType = 'S-Bahn' | 'U-Bahn' | 'Bus' | 'Tram' | 'Regional';

export type LineColor = 
  | '#00985f' // S1
  | '#dc281e' // S2
  | '#ffd500' // S3
  | '#00a5e3' // S4
  | '#f18700' // S5
  | '#00543c' // S6
  | '#3c8eda' // U1
  | '#c9283e' // U2
  | '#9c2a96' // U4, U12
  | '#00549f' // U5
  | '#6e2585' // U6
  | '#003e7e' // U14
  | string;

export interface Station {
  id: string;
  name: string;
  city?: string;
  /** VVS station number (e.g., "5006056" for Stuttgart Hbf) */
  vvsId?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Stop {
  station: Station;
  /** Scheduled departure time in ISO 8601 format */
  scheduledDeparture: string;
  /** Actual departure time (if available) */
  actualDeparture?: string;
  /** Delay in minutes (can be negative for early departures) */
  delay?: number;
  platform?: string;
  /** Track/platform changes */
  platformChange?: boolean;
}

export interface Line {
  id: string;
  /** Line number (e.g., "S1", "U6", "92") */
  number: string;
  type: TransportType;
  color: LineColor;
  /** Line direction/destination */
  direction: string;
  /** Operator (e.g., "DB Regio", "SSB") */
  operator?: string;
}

export interface Friend {
  id: string;
  name: string;
  avatarUrl?: string;
  /** Online status - in real app, from Supabase presence */
  isOnline: boolean;
}

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
  status: 'on-time' | 'delayed' | 'cancelled';
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

/**
 * Supabase Database Schema (Conceptual)
 */
export interface DbUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DbConnection {
  id: string;
  trip_id: string;
  line_number: string;
  line_type: TransportType;
  departure_station_id: string;
  arrival_station_id: string;
  scheduled_departure: string;
  created_at: string;
}

export interface DbUserConnection {
  id: string;
  user_id: string;
  connection_id: string;
  joined_at: string;
  left_at?: string;
}

export interface DbFriendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

