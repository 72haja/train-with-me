/**
 * GET /api/stations – stations list (mocked).
 * Optional query: ?q=... to filter by name or city.
 * Simulates the future real stations API.
 */
import { connection, NextRequest, NextResponse } from "next/server";
import { mockStations, searchStations } from "@apis/mockStations";

export async function GET(request: NextRequest) {
    await connection();
    try {
        const q = request.nextUrl.searchParams.get("q");
        const stations = q != null && q.trim() !== "" ? searchStations(q.trim()) : mockStations;

        return NextResponse.json({
            success: true,
            data: stations,
        });
    } catch (error) {
        console.error("Error in /api/stations:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch stations" },
            { status: 500 }
        );
    }
}
