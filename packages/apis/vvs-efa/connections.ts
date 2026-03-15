/**
 * VVS EFA trip/connection search
 */
import type { Connection, Line, Stop, TransportType } from "@/packages/types/lib/types";
import { efaClient } from "./client";
import type { EfaStopSeqItem, EfaTrip, EfaTripLeg, EfaTripResponse } from "./types";

/**
 * Search for connections between two stations
 */
export async function searchEfaConnections(
    originId: string,
    destinationId: string,
    dateTime?: string,
    limit = 5
): Promise<Connection[]> {
    const date = dateTime ? new Date(dateTime) : new Date();
    const itdDate = formatDate(date);
    const itdTime = formatTime(date);

    const response = await efaClient<EfaTripResponse>("XML_TRIP_REQUEST2", {
        type_origin: "stop",
        name_origin: originId,
        type_destination: "stop",
        name_destination: destinationId,
        itdDate,
        itdTime,
        calcNumberOfTrips: limit,
        useRealtime: 1,
    });

    const trips = response.trips ?? [];
    return trips.map((trip, idx) => mapEfaTripToConnection(trip, idx));
}

function mapEfaTripToConnection(trip: EfaTrip, index: number): Connection {
    const legs = trip.legs ?? [];
    const firstLeg = legs[0]!;
    const lastLeg = legs[legs.length - 1]!;

    // Use the first non-walk leg for the line info
    const mainLeg = legs.find(l => l.mode.type !== "100") ?? firstLeg;

    const lineNumber = mainLeg.mode.symbol || mainLeg.mode.number;
    const transportType = mapModeType(mainLeg.mode.type);

    const line: Line = {
        id: mainLeg.mode.diva?.stateless ?? `trip-${index}`,
        number: lineNumber,
        type: transportType,
        color: getLineColor(lineNumber),
        direction: mainLeg.mode.destination,
        operator: mainLeg.mode.diva?.operator,
    };

    const departurePoint = firstLeg.points.find(p => p.usage === "departure")!;
    const arrivalPoint = lastLeg.points.find(p => p.usage === "arrival")!;

    const departureStop: Stop = {
        station: {
            id: departurePoint.ref.id,
            name: departurePoint.nameWO || departurePoint.name,
            city: departurePoint.place || undefined,
        },
        scheduledDeparture: stampToIso(departurePoint.stamp.date, departurePoint.stamp.time),
        actualDeparture:
            departurePoint.stamp.rtDate && departurePoint.stamp.rtTime
                ? stampToIso(departurePoint.stamp.rtDate, departurePoint.stamp.rtTime)
                : undefined,
        platform: departurePoint.platformName || "",
        platformChange:
            departurePoint.platformName !== departurePoint.plannedPlatformName ? true : undefined,
    };

    const arrivalStop: Stop = {
        station: {
            id: arrivalPoint.ref.id,
            name: arrivalPoint.nameWO || arrivalPoint.name,
            city: arrivalPoint.place || undefined,
        },
        scheduledDeparture: stampToIso(arrivalPoint.stamp.date, arrivalPoint.stamp.time),
        actualDeparture:
            arrivalPoint.stamp.rtDate && arrivalPoint.stamp.rtTime
                ? stampToIso(arrivalPoint.stamp.rtDate, arrivalPoint.stamp.rtTime)
                : undefined,
        platform: arrivalPoint.platformName || "",
        platformChange:
            arrivalPoint.platformName !== arrivalPoint.plannedPlatformName ? true : undefined,
    };

    // Build intermediate stops from the first leg's stopSeq
    const stops = buildStops(legs);

    const hasRealtime =
        departurePoint.stamp.rtDate !== departurePoint.stamp.date ||
        departurePoint.stamp.rtTime !== departurePoint.stamp.time;

    const stableTripId = mainLeg.mode.diva?.stateless;
    // Build a deterministic ID from line + origin + departure so both users get the same ID
    const connectionId = `efa-${lineNumber}-${departurePoint.ref.id}-${departureStop.scheduledDeparture}`;

    return {
        id: connectionId,
        line,
        departure: departureStop,
        arrival: arrivalStop,
        stops,
        tripId: stableTripId ?? `trip-${index}`,
        friends: [],
        status: "on-time",
        hasRealTimeData: hasRealtime,
    };
}

function buildStops(legs: EfaTripLeg[]): Stop[] {
    // Collect transfer station IDs (where one leg ends and the next begins)
    const transferIds = new Set<string>();
    for (let i = 0; i < legs.length - 1; i++) {
        const currentSeq = legs[i]!.stopSeq ?? [];
        const nextSeq = legs[i + 1]!.stopSeq ?? [];
        const lastOfCurrent = currentSeq[currentSeq.length - 1];
        const firstOfNext = nextSeq[0];
        if (lastOfCurrent && firstOfNext && lastOfCurrent.ref.id === firstOfNext.ref.id) {
            transferIds.add(lastOfCurrent.ref.id);
        }
    }

    const stops: Stop[] = [];
    for (const leg of legs) {
        const seq = leg.stopSeq ?? [];
        for (const item of seq) {
            const stop = mapStopSeqItemToStop(item);
            if (transferIds.has(item.ref.id)) {
                stop.isTransfer = true;
            }
            stops.push(stop);
        }
    }

    // Deduplicate consecutive stops (transfer points)
    const deduped: Stop[] = [];
    for (const stop of stops) {
        const prev = deduped[deduped.length - 1];
        if (!prev || prev.station.id !== stop.station.id) {
            deduped.push(stop);
        }
    }

    return deduped;
}

function mapStopSeqItemToStop(item: EfaStopSeqItem): Stop {
    const depTime = item.ref.depDateTime;
    const arrTime = item.ref.arrDateTime;
    const time = depTime ?? arrTime ?? "";

    // Parse "YYYYMMDD HH:MM" format
    const scheduled = time ? parseEfaRefDateTime(time) : "";

    return {
        station: {
            id: item.ref.id,
            name: item.nameWO || item.name,
            city: item.place || undefined,
        },
        scheduledDeparture: scheduled,
        delay: item.ref.depDelay ? parseInt(item.ref.depDelay, 10) || undefined : undefined,
        platform: item.platformName || "",
    };
}

function parseEfaRefDateTime(dt: string): string {
    // Format: "YYYYMMDD HH:MM" -> ISO
    const [datePart, timePart] = dt.split(" ");
    if (!datePart || !timePart) return dt;
    const y = datePart.slice(0, 4);
    const m = datePart.slice(4, 6);
    const d = datePart.slice(6, 8);
    return `${y}-${m}-${d}T${timePart}:00`;
}

function stampToIso(date: string, time: string): string {
    // date: YYYYMMDD, time: HHMM (may be 3 or 4 digits)
    const y = date.slice(0, 4);
    const m = date.slice(4, 6);
    const d = date.slice(6, 8);
    const padded = time.padStart(4, "0");
    const h = padded.slice(0, 2);
    const min = padded.slice(2, 4);
    return `${y}-${m}-${d}T${h}:${min}:00`;
}

function mapModeType(type: string): TransportType {
    switch (type) {
        case "1":
            return "S-Bahn";
        case "2":
        case "3":
            return "U-Bahn";
        case "4":
            return "Tram";
        case "5":
        case "6":
        case "7":
            return "Bus";
        default:
            return "Regional";
    }
}

function getLineColor(label: string): string {
    const colorMap: Record<string, string> = {
        S1: "#00985f",
        S2: "#dc281e",
        S3: "#ffd500",
        S4: "#00a5e3",
        S5: "#f18700",
        S6: "#00543c",
        U1: "#3c8eda",
        U2: "#c9283e",
        U4: "#9c2a96",
        U5: "#00549f",
        U6: "#6e2585",
        U12: "#9c2a96",
        U14: "#003e7e",
    };
    return colorMap[label] || "#666666";
}

function formatDate(d: Date): string {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(d: Date): string {
    return `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
}
