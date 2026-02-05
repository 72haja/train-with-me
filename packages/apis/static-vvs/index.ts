/**
 * Static VVS API
 * Types and data structures for a static connection timetable when the live API is unavailable.
 */

export type {
    StaticLine,
    StaticLineDirection,
    StaticStationRef,
    StaticStopTime,
    StaticTrip,
    StaticIntervalSchedule,
    StaticVvsData,
    TimeOfDay,
} from "./types";

export {
    searchStaticConnections,
    getStaticJourneyById,
    type Journey,
    type JourneySegment,
    type JourneySegmentStop,
} from "./search";
