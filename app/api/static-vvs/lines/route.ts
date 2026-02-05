/**
 * GET /api/static-vvs/lines – list all lines from static data.
 */
import { NextResponse } from "next/server";
import { staticVvsMockData } from "@apis/static-vvs/data/mock-data";

export async function GET() {
    try {
        const lines = staticVvsMockData.lines.map(line => ({
            id: line.id,
            number: line.number,
            type: line.type,
            color: line.color,
            directions: line.directions.map(d => ({
                headsign: d.headsign,
                stationIds: d.stationIds,
            })),
        }));
        return NextResponse.json({ lines });
    } catch (error) {
        console.error("Error in /api/static-vvs/lines:", error);
        return NextResponse.json(
            { error: "Failed to fetch lines" },
            { status: 500 }
        );
    }
}
