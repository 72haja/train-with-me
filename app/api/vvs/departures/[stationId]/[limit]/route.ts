/**
 * API Route: Get Departures (with limit)
 *
 * GET /api/vvs/departures/[stationId]/[limit]
 *
 * This endpoint fetches departures from a VVS station and enriches them
 * with friend data from Supabase. Uses the limit from route params.
 *
 * Note: Using RouteContext for both stationId and limit avoids prerendering issues.
 */
import { NextRequest, NextResponse } from "next/server";
import { getDepartures } from "@/app/api/vvs/departures/getDepartures";

export async function GET(
    _request: NextRequest,
    { params }: RouteContext<"/api/vvs/departures/[stationId]/[limit]">
) {
    try {
        // Get stationId and limit from route params
        const { stationId, limit: limitParam } = await params;

        // Parse limit from route param
        const limit = parseInt(limitParam || "20", 10);

        if (!stationId) {
            return NextResponse.json({ error: "stationId is required" }, { status: 400 });
        }

        if (isNaN(limit) || limit < 1) {
            return NextResponse.json({ error: "limit must be a positive number" }, { status: 400 });
        }

        // In production, this would:
        // 1. Fetch departures from VVS API
        // const vvsDepartures = await fetchDeparturesFromVVS(stationId);

        // 2. Get current user from session
        // const session = await getServerSession();
        // if (!session?.user?.id) {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        // 3. For each connection, fetch friends who are on it
        // const connectionsWithFriends = await Promise.all(
        //   vvsDepartures.map(async (connection) => {
        //     const friends = await getFriendsOnConnection(session.user.id, connection.id);
        //     return { ...connection, friends };
        //   })
        // );

        const result = await getDepartures(stationId, limit);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching departures:", error);
        return NextResponse.json({ error: "Failed to fetch departures" }, { status: 500 });
    }
}
