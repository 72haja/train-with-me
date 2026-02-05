/**
 * GET /api/static-vvs/stations – list stations from static data.
 * Optional query: ?q=... to filter by name.
 */
import { NextRequest, NextResponse } from "next/server";
import { staticVvsMockData } from "@apis/static-vvs/data/mock-data";

export async function GET(request: NextRequest) {
    try {
        let stations = staticVvsMockData.stations ?? [];
        const q = request.nextUrl.searchParams.get("q");
        if (q && q.trim()) {
            const lower = q.trim().toLowerCase();
            stations = stations.filter(
                s => s.name.toLowerCase().includes(lower) || s.id.toLowerCase().includes(lower)
            );
        }
        return NextResponse.json({ stations });
    } catch (error) {
        console.error("Error in /api/static-vvs/stations:", error);
        return NextResponse.json(
            { error: "Failed to fetch stations" },
            { status: 500 }
        );
    }
}
