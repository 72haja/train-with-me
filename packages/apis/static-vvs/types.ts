/**
 * Types for the static VVS connection API
 *
 * Use these when the live VVS/MobiData API is not available.
 * Data is authored manually (e.g. from PDF timetables) and does not update in real time.
 */
import type { TransportType } from "@/packages/types/lib/types";

/** Station reference in static data (id must match your Station.id, e.g. de:08111:6056) */
export interface StaticStationRef {
    id: string;
    name: string;
}

/**
 * One direction of a line (e.g. S1 toward Herrenberg).
 * Stations are ordered from first to last stop.
 */
export interface StaticLineDirection {
    /** Display direction (e.g. "Herrenberg", "Kirchheim (Teck)") */
    headsign: string;
    /** Ordered station IDs from start to end of line */
    stationIds: string[];
}

/**
 * Line definition (e.g. S1, S2, U6).
 * Each line has one or two directions with their stop sequence.
 */
export interface StaticLine {
    /** Unique line id (e.g. "S1", "s1-route-id") */
    id: string;
    /** Short name shown in UI (e.g. "S1", "U6") */
    number: string;
    type: TransportType;
    /** Hex color for line badge */
    color: string;
    /** One entry per direction (typically 2: A→B and B→A) */
    directions: StaticLineDirection[];
}

/**
 * Time of day in "HH:MM" or "HH:MM:SS" (no date).
 * Used for static timetables that repeat daily.
 */
export type TimeOfDay = string;

/**
 * Stop time for one station within a trip.
 * arrival/departure are time-of-day strings.
 */
export interface StaticStopTime {
    stationId: string;
    /** Arrival time (e.g. "07:32") */
    arrival: TimeOfDay;
    /** Departure time (e.g. "07:33"); can equal arrival for through stops */
    departure: TimeOfDay;
    /** Platform / track (e.g. "1", "2a") */
    platform?: string;
}

/**
 * One concrete "run" of a line in one direction with times at each stop.
 * Use this when you have fixed timetable rows (e.g. from a PDF).
 */
export interface StaticTrip {
    /** Unique trip id (e.g. "s1-herrenberg-0530") */
    tripId: string;
    lineId: string;
    /** Index into StaticLine.directions */
    directionIndex: number;
    /** Stop times in order (must match line direction's stationIds) */
    stopTimes: StaticStopTime[];
}

/**
 * Schedule based on first departure and regular interval.
 * Use when trains run every N minutes (e.g. every 15 min from 05:00).
 * runningTimesMinutes[i] = minutes from first station to station i (first = 0).
 */
export interface StaticIntervalSchedule {
    lineId: string;
    directionIndex: number;
    /** First departure from first station (e.g. "05:00") */
    firstDeparture: TimeOfDay;
    /** Last departure from first station (e.g. "00:30" for night) */
    lastDeparture?: TimeOfDay;
    /** Minutes between departures (e.g. 15, 20) */
    intervalMinutes: number;
    /** Minutes from first station to each station; length = number of stations, first = 0 */
    runningTimesMinutes: number[];
}

/**
 * Static dataset: lines, optional station list, and either explicit trips or interval schedules.
 */
export interface StaticVvsData {
    /** All lines with their stop sequences per direction */
    lines: StaticLine[];
    /** Optional: station id → name (can reuse Station from elsewhere) */
    stations?: StaticStationRef[];
    /**
     * Timetable: either explicit trips or interval-based.
     * Use trips when you have exact rows; use intervalSchedules when service is regular.
     */
    trips?: StaticTrip[];
    intervalSchedules?: StaticIntervalSchedule[];
}
