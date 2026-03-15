/**
 * GET /api/static-vvs/lines/[lineId] – single line with directions and station list.
 */
import { NextRequest, NextResponse } from "next/server";
import { staticVvsMockData } from "@apis/static-vvs/data/mock-data";

function getStationName(stationId: string): string {
    const s = staticVvsMockData.stations?.find(st => st.id === stationId);
    return s?.name ?? stationId;
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ lineId: string }> }
) {
    try {
        const { lineId } = await params;
        const line = staticVvsMockData.lines.find(
            l => l.id === lineId || l.number.toLowerCase() === lineId.toLowerCase()
        );
        if (!line) {
            return NextResponse.json({ error: "Line not found" }, { status: 404 });
        }
        const directionsWithStations = line.directions.map(d => ({
            headsign: d.headsign,
            stationIds: d.stationIds,
            stations: d.stationIds.map(id => ({ id, name: getStationName(id) })),
        }));
        return NextResponse.json({
            line: {
                id: line.id,
                number: line.number,
                type: line.type,
                color: line.color,
                directions: directionsWithStations,
            },
        });
    } catch (error) {
        console.error("Error in /api/static-vvs/lines/[lineId]:", error);
        return NextResponse.json({ error: "Failed to fetch line" }, { status: 500 });
    }
}
