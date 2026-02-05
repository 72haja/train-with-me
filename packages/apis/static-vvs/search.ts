/**
 * Static connection search: find journeys from static VVS data.
 * Returns the same Journey shape as the live API for drop-in testing.
 */
import type {
    StaticLineDirection,
    StaticTrip,
    StaticVvsData,
} from "./types";

/** One stop with times (used when segment has full stop list from static data) */
export interface JourneySegmentStop {
    stationId: string;
    name: string;
    arrival: string;
    departure: string;
    platform?: string;
}

/** Matches app/api/connections/search route response shape */
export interface JourneySegment {
    tripId: string;
    routeInfo: {
        number: string;
        type: string;
        direction: string;
    };
    fromStation: { id: string; name: string };
    toStation: { id: string; name: string };
    departureTime: string;
    arrivalTime: string;
    isTransfer?: boolean;
    /** Full stop list from origin to destination (static API only) */
    stops?: JourneySegmentStop[];
}

export interface Journey {
    id: string;
    segments: JourneySegment[];
    totalDuration: number;
    departureTime: string;
    arrivalTime: string;
    transferCount: number;
}

function getStationName(data: StaticVvsData, stationId: string): string {
    const s = data.stations?.find(st => st.id === stationId);
    return s?.name ?? stationId;
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
}

/** Build ISO datetime for a given date and time-of-day (HH:MM or HH:MM:SS) */
function toIsoDateTime(dateStr: string, timeOfDay: string): string {
    const date = dateStr.split("T")[0];
    const [h, m, s] = timeOfDay.split(":").map(Number);
    const hour = h ?? 0;
    const minute = m ?? 0;
    const second = s ?? 0;
    return `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

/** Get date part from ISO or date-only string */
function getDatePart(datetime: string | undefined): string | undefined {
    if (!datetime) return undefined;
    const d = new Date(datetime);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 10);
}

/**
 * Search connections from static data.
 * Only direct journeys (one line, no transfers) are supported.
 *
 * @param data - Static VVS dataset
 * @param originId - Station ID of origin
 * @param destinationId - Station ID of destination
 * @param searchDate - Optional ISO datetime or date string to filter departures (only show trips departing at or after this time on the same day)
 * @param limit - Max number of journeys to return (default 20)
 */
export function searchStaticConnections(
    data: StaticVvsData,
    originId: string,
    destinationId: string,
    searchDate?: string,
    limit: number = 20
): Journey[] {
    const journeys: Journey[] = [];
    const datePart = getDatePart(searchDate);
    const searchTimeMinutes = searchDate
        ? timeToMinutes(new Date(searchDate).toTimeString().slice(0, 5))
        : 0;

    for (const line of data.lines) {
        for (let directionIndex = 0; directionIndex < line.directions.length; directionIndex++) {
            const dir: StaticLineDirection = line.directions[directionIndex]!;
            const originIdx = dir.stationIds.indexOf(originId);
            const destIdx = dir.stationIds.indexOf(destinationId);
            if (originIdx === -1 || destIdx === -1 || originIdx >= destIdx) continue;

            const lineTrips = (data.trips ?? []).filter(
                (t): t is StaticTrip =>
                    t.lineId === line.id && t.directionIndex === directionIndex
            );

            for (const trip of lineTrips) {
                const originIdxInTrip = trip.stopTimes.findIndex(st => st.stationId === originId);
                const destIdxInTrip = trip.stopTimes.findIndex(st => st.stationId === destinationId);
                if (originIdxInTrip === -1 || destIdxInTrip === -1 || originIdxInTrip >= destIdxInTrip)
                    continue;

                const originStop = trip.stopTimes[originIdxInTrip]!;
                const destStop = trip.stopTimes[destIdxInTrip]!;
                const depTime = originStop.departure;
                const arrTime = destStop.arrival;
                if (datePart && searchDate) {
                    const depMinutes = timeToMinutes(depTime);
                    if (depMinutes < searchTimeMinutes) continue;
                }

                const depDateTime = datePart
                    ? toIsoDateTime(datePart, depTime)
                    : toIsoDateTime("1970-01-01", depTime);
                const arrDateTime = datePart
                    ? toIsoDateTime(datePart, arrTime)
                    : toIsoDateTime("1970-01-01", arrTime);
                const totalDuration = Math.round(
                    (new Date(arrDateTime).getTime() - new Date(depDateTime).getTime()) / (1000 * 60)
                );

                const baseDate = datePart ?? "1970-01-01";
                const segmentStops: JourneySegmentStop[] = trip.stopTimes
                    .slice(originIdxInTrip, destIdxInTrip + 1)
                    .map(st => ({
                        stationId: st.stationId,
                        name: getStationName(data, st.stationId),
                        arrival: datePart ? toIsoDateTime(baseDate, st.arrival) : st.arrival,
                        departure: datePart ? toIsoDateTime(baseDate, st.departure) : st.departure,
                        platform: st.platform,
                    }));

                journeys.push({
                    id: `static-${trip.tripId}`,
                    segments: [
                        {
                            tripId: trip.tripId,
                            routeInfo: {
                                number: line.number,
                                type: line.type,
                                direction: dir.headsign,
                            },
                            fromStation: {
                                id: originId,
                                name: getStationName(data, originId),
                            },
                            toStation: {
                                id: destinationId,
                                name: getStationName(data, destinationId),
                            },
                            departureTime: depDateTime,
                            arrivalTime: arrDateTime,
                            isTransfer: false,
                            stops: segmentStops,
                        },
                    ],
                    totalDuration,
                    departureTime: depDateTime,
                    arrivalTime: arrDateTime,
                    transferCount: 0,
                });
            }
        }
    }

    journeys.sort(
        (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );
    return journeys.slice(0, limit);
}

/**
 * Get a single journey by static connection id (e.g. "static-s1-herrenberg-0530").
 * Returns a Journey with full stops for the entire trip, or null if not found.
 * Uses datePart for ISO times (defaults to today).
 */
export function getStaticJourneyById(
    data: StaticVvsData,
    connectionId: string,
    datePart?: string
): Journey | null {
    if (!connectionId.startsWith("static-")) return null;
    const tripId = connectionId.slice("static-".length);
    const trip = (data.trips ?? []).find(t => t.tripId === tripId);
    if (!trip) return null;

    const line = data.lines.find(l => l.id === trip.lineId);
    if (!line) return null;

    const dir = line.directions[trip.directionIndex];
    if (!dir) return null;

    const baseDate = datePart ?? new Date().toISOString().slice(0, 10);
    const segmentStops: JourneySegmentStop[] = trip.stopTimes.map(st => ({
        stationId: st.stationId,
        name: getStationName(data, st.stationId),
        arrival: toIsoDateTime(baseDate, st.arrival),
        departure: toIsoDateTime(baseDate, st.departure),
        platform: st.platform,
    }));

    const first = trip.stopTimes[0]!;
    const last = trip.stopTimes[trip.stopTimes.length - 1]!;
    const depDateTime = toIsoDateTime(baseDate, first.departure);
    const arrDateTime = toIsoDateTime(baseDate, last.arrival);
    const totalDuration = Math.round(
        (new Date(arrDateTime).getTime() - new Date(depDateTime).getTime()) / (1000 * 60)
    );

    return {
        id: connectionId,
        segments: [
            {
                tripId: trip.tripId,
                routeInfo: {
                    number: line.number,
                    type: line.type,
                    direction: dir.headsign,
                },
                fromStation: {
                    id: first.stationId,
                    name: getStationName(data, first.stationId),
                },
                toStation: {
                    id: last.stationId,
                    name: getStationName(data, last.stationId),
                },
                departureTime: depDateTime,
                arrivalTime: arrDateTime,
                isTransfer: false,
                stops: segmentStops,
            },
        ],
        totalDuration,
        departureTime: depDateTime,
        arrivalTime: arrDateTime,
        transferCount: 0,
    };
}
