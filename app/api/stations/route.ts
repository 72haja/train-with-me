/**
 * GET /api/stations – station search via VVS EFA API.
 * Optional query: ?q=... to search by name.
 * Returns default VVS stations when no query is provided.
 */
import { NextRequest, NextResponse, connection } from "next/server";
import { mockStations } from "@apis/mockStations";
import { searchEfaStations } from "@apis/vvs-efa";

export async function GET(request: NextRequest) {
    await connection();
    try {
        const q = request.nextUrl.searchParams.get("q");
        const trainOnly = request.nextUrl.searchParams.get("trainOnly") === "true";

        if (!q || q.trim() === "") {
            return NextResponse.json({
                success: true,
                data: mockStations,
            });
        }

        const stations = await searchEfaStations(q.trim(), trainOnly);
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
