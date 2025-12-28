/**
 * Transport and Line types
 * Types for public transport lines and transport types
 */

export type TransportType = "S-Bahn" | "U-Bahn" | "Bus" | "Tram" | "Regional";

export type LineColor =
    | "#00985f" // S1
    | "#dc281e" // S2
    | "#ffd500" // S3
    | "#00a5e3" // S4
    | "#f18700" // S5
    | "#00543c" // S6
    | "#3c8eda" // U1
    | "#c9283e" // U2
    | "#9c2a96" // U4, U12
    | "#00549f" // U5
    | "#6e2585" // U6
    | "#003e7e" // U14
    | string;

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
