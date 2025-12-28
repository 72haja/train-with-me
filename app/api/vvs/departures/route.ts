/**
 * API Route: Get Departures
 *
 * GET /api/vvs/departures?stationId=5006056&limit=20
 *
 * This endpoint fetches departures from a VVS station and enriches them
 * with friend data from Supabase.
 */
import { NextRequest, NextResponse } from "next/server";
import { mockConnections } from "@apis/mockData";

// import { fetchDeparturesFromVVS } from '@/packages/apis/vvs/api';
// import { getFriendsOnConnection } from '@/packages/apis/supabase/queries';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const stationId = searchParams.get("stationId");
        const limit = parseInt(searchParams.get("limit") || "20");

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

        // For now, return mock data
        const connections = mockConnections.slice(0, limit);

        return NextResponse.json({
            success: true,
            data: connections,
            meta: {
                stationId,
                count: connections.length,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Error fetching departures:", error);
        return NextResponse.json({ error: "Failed to fetch departures" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";
export const revalidate = 30; // Revalidate every 30 seconds
