/**
 * API Route: Search Stations
 *
 * GET /api/stations/[[...query]]
 *
 * This endpoint searches for stations using the MobiData BW API
 * Results are cached per query for 1 day using Next.js unstable_cache
 *
 * Note: Using RouteContext for query avoids prerendering issues.
 * The query parameter is URL-encoded in the path.
 * Using optional catch-all route to handle empty queries.
 */
import { NextRequest, NextResponse } from "next/server";
import { searchStations as searchStationsInternal } from "@apis/mobidata/stations";

export async function GET(
    _request: NextRequest,
    { params }: RouteContext<"/api/stations/[[...query]]">
) {
    try {
        // Get query from route params (optional catch-all, so it's an array or undefined)
        const { query } = await params;

        // Decode the query parameter (it's URL-encoded in the path)
        // Handle empty array, undefined, or single element array
        let decodedQuery = "";
        if (query && Array.isArray(query) && query.length > 0 && query[0]) {
            decodedQuery = decodeURIComponent(query[0]);
        } else if (query && typeof query === "string") {
            decodedQuery = decodeURIComponent(query);
        }

        const stations = await searchStationsInternal(decodedQuery);

        return NextResponse.json({
            success: true,
            data: stations,
        });
    } catch (error) {
        console.error("Error searching stations:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to search stations",
            },
            { status: 500 }
        );
    }
}
