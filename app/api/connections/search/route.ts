/**
 * API route for searching connections with multi-hop support
 */
import { NextRequest, NextResponse } from "next/server";
import { searchConnectionsMultiHop } from "@apis/mobidata/connections";
import type { JourneyPath } from "@apis/mobidata/trip-graph";

/**
 * Journey structure for API response
 */
export interface Journey {
    id: string;
    segments: JourneySegment[];
    totalDuration: number; // in minutes
    departureTime: string;
    arrivalTime: string;
    transferCount: number;
}

export interface JourneySegment {
    tripId: string;
    routeInfo: {
        number: string;
        type: string;
        direction: string;
    };
    fromStation: {
        id: string;
        name: string;
    };
    toStation: {
        id: string;
        name: string;
    };
    departureTime: string;
    arrivalTime: string;
    isTransfer?: boolean;
    /** Full stop list from origin to destination (e.g. from static API) */
    stops?: Array<{
        stationId: string;
        name: string;
        arrival: string;
        departure: string;
        platform?: string;
    }>;
}

/**
 * Convert JourneyPath to Journey format
 */
function convertJourneyPathToJourney(path: JourneyPath, index: number): Journey {
    const departureTime = new Date(path.departureTime);
    const arrivalTime = new Date(path.arrivalTime);
    const totalDuration = Math.round(
        (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60)
    );

    const segments: JourneySegment[] = path.segments.map(seg => ({
        tripId: seg.segment.tripId,
        routeInfo: {
            number: seg.segment.routeInfo.routeShortName,
            type: seg.segment.routeInfo.routeType,
            direction: seg.segment.routeInfo.tripHeadsign,
        },
        fromStation: {
            id: seg.segment.fromStationId,
            name: "", // Will be filled by mapper if needed
        },
        toStation: {
            id: seg.segment.toStationId,
            name: "", // Will be filled by mapper if needed
        },
        departureTime: seg.segment.departureTime,
        arrivalTime: seg.segment.arrivalTime,
        isTransfer: seg.isTransfer,
    }));

    return {
        id: `journey-${index}`,
        segments,
        totalDuration,
        departureTime: path.departureTime,
        arrivalTime: path.arrivalTime,
        transferCount: path.transferCount,
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { originId, destinationId, date, time } = body;

        if (!originId || !destinationId) {
            return NextResponse.json(
                { error: "originId and destinationId are required" },
                { status: 400 }
            );
        }

        // Combine date and time if both provided
        let searchDate: string | undefined;
        if (date) {
            if (time) {
                // Combine date and time into ISO string
                searchDate = new Date(`${date}T${time}`).toISOString();
            } else {
                searchDate = new Date(date).toISOString();
            }
        }

        console.log("=============== searchConnectionsMultiHop ===============");
        // Search for connections
        const paths = await searchConnectionsMultiHop(originId, destinationId, searchDate);

        // Convert to Journey format
        const journeys: Journey[] = paths.map((path, index) =>
            convertJourneyPathToJourney(path, index)
        );

        // Sort by departure time (already sorted by searchConnectionsMultiHop, but ensure)
        journeys.sort(
            (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
        );

        return NextResponse.json({ journeys });
    } catch (error) {
        console.error("Error in /api/connections/search:", error);
        return NextResponse.json({ error: "Failed to search connections" }, { status: 500 });
    }
}
