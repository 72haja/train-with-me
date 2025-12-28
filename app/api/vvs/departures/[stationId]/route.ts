/**
 * API Route: Get Departures (without limit, defaults to 20)
 *
 * GET /api/vvs/departures/[stationId]
 *
 * This endpoint fetches departures from a VVS station and enriches them
 * with friend data from Supabase. Defaults to 20 departures.
 *
 * Note: Using RouteContext for stationId avoids prerendering issues.
 */
import { NextRequest, NextResponse } from "next/server";
import { getDepartures } from "@/app/api/vvs/departures/getDepartures";

export async function GET(
    _request: NextRequest,
    { params }: RouteContext<"/api/vvs/departures/[stationId]">
) {
    try {
        // Get stationId from route params
        const { stationId } = await params;

        // Default limit to 20
        const limit = 20;

        if (!stationId) {
            return NextResponse.json({ error: "stationId is required" }, { status: 400 });
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
