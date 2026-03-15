/**
 * VVS EFA departure monitor
 */
import type { Connection, Line, Stop, TransportType } from "@/packages/types/lib/types";
import { efaClient } from "./client";
import type { EfaDateTime, EfaDeparture, EfaDepartureResponse } from "./types";

/**
 * Get departures for a station
 */
export async function getEfaDepartures(stopId: string, limit = 20): Promise<Connection[]> {
    const now = new Date();
    const response = await efaClient<EfaDepartureResponse>("XML_DM_REQUEST", {
        type_dm: "stop",
        name_dm: stopId,
        itdDate: formatDate(now),
        itdTime: formatTime(now),
        mode: "direct",
        useRealtime: 1,
        limit,
    });

    const departures = response.departureList ?? [];
    return departures.map(mapEfaDepartureToConnection);
}

function mapEfaDepartureToConnection(dep: EfaDeparture): Connection {
    const transportType = mapMotType(dep.servingLine.motType);
    const lineNumber = dep.servingLine.symbol || dep.servingLine.number;

    const line: Line = {
        id: dep.servingLine.stateless,
        number: lineNumber,
        type: transportType,
        color: getLineColor(lineNumber),
        direction: dep.servingLine.direction,
        operator: dep.operator?.name,
    };

    const scheduledTime = efaDateTimeToIso(dep.dateTime);
    const actualTime = dep.realDateTime ? efaDateTimeToIso(dep.realDateTime) : undefined;
    const delay = parseInt(dep.servingLine.delay, 10) || undefined;

    const departureStop: Stop = {
        station: {
            id: dep.stopID,
            name: dep.nameWO || dep.stopName,
        },
        scheduledDeparture: scheduledTime,
        actualDeparture: actualTime,
        delay,
        platform: dep.platformName || dep.platform || "",
    };

    const destinationStop: Stop = {
        station: {
            id: dep.servingLine.destID,
            name: dep.servingLine.direction,
        },
        scheduledDeparture: scheduledTime,
        platform: "",
    };

    return {
        id: `dep-${dep.stopID}-${scheduledTime}-${lineNumber}`,
        line,
        departure: departureStop,
        arrival: destinationStop,
        stops: [departureStop],
        tripId: dep.servingLine.stateless,
        friends: [],
        status: delay && delay > 5 ? "delayed" : "on-time",
        hasRealTimeData: dep.servingLine.realtime === "1",
    };
}

function mapMotType(motType: string): TransportType {
    switch (motType) {
        case "0":
            return "Regional"; // Zug
        case "1":
            return "S-Bahn"; // S-Bahn
        case "2": // U-Bahn
        case "3":
            return "U-Bahn"; // Stadtbahn
        case "4":
            return "Tram"; // Straßenbahn
        case "5": // Stadtbus
        case "6": // Regionalbus
        case "7":
            return "Bus"; // Schnellbus
        case "13":
            return "Regional"; // Zug (Nahverkehr)
        default:
            return "Bus";
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

function efaDateTimeToIso(dt: EfaDateTime): string {
    const y = dt.year;
    const m = dt.month.padStart(2, "0");
    const d = dt.day.padStart(2, "0");
    const h = dt.hour.padStart(2, "0");
    const min = dt.minute.padStart(2, "0");
    return `${y}-${m}-${d}T${h}:${min}:00`;
}

function formatDate(d: Date): string {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(d: Date): string {
    return `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
}
