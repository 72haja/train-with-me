/**
 * Station types
 * Types for train/bus stations
 */

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
    locationType?: string;
}
