import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@apis/supabase/server";

export type UserConnectionRow = {
    connection_id: string;
    origin_station_id: string | null;
    origin_station_name: string | null;
    destination_station_id: string | null;
    destination_station_name: string | null;
    departure_time: string | null;
    arrival_time: string | null;
    line_number: string | null;
    line_type: string | null;
    line_color: string | null;
    line_direction: string | null;
};

/**
 * GET /api/connections/me
 * Returns the list of connections the current user has joined (and not left),
 * including display metadata and friends on the same connection.
 */
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get user's active connections
        const { data, error } = await supabase
            .from("user_connections")
            .select(
                "connection_id, origin_station_id, origin_station_name, destination_station_id, destination_station_name, departure_time, arrival_time, line_number, line_type, line_color, line_direction"
            )
            .eq("user_id", user.id)
            .is("left_at", null);

        if (error) {
            console.error("Error fetching user connections:", error);
            return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
        }

        const rows = (data ?? []) as UserConnectionRow[];
        const connectionIds = rows.map(row => row.connection_id);

        // 2. Get user's friends
        const { data: friendships, error: friendsError } = await supabase
            .from("friendships")
            .select(
                `
                user_id,
                friend_id,
                requester:profiles!user_id ( id, full_name, avatar_url ),
                recipient:profiles!friend_id ( id, full_name, avatar_url )
                `
            )
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq("status", "accepted");

        const friendIds: string[] = [];
        const friendProfiles: Record<
            string,
            { id: string; name: string; avatarUrl: string | null }
        > = {};

        if (!friendsError && friendships) {
            for (const f of friendships) {
                const requester = Array.isArray(f.requester) ? f.requester[0] : f.requester;
                const recipient = Array.isArray(f.recipient) ? f.recipient[0] : f.recipient;
                const friend = f.user_id === user.id ? recipient : requester;
                if (friend?.id) {
                    friendIds.push(friend.id);
                    friendProfiles[friend.id] = {
                        id: friend.id,
                        name: friend.full_name || "Unknown",
                        avatarUrl: friend.avatar_url || null,
                    };
                }
            }
        }

        // 3. Get which friends are on which of our connections
        const friendsOnConnections: Record<string, (typeof friendProfiles)[string][]> = {};

        if (connectionIds.length > 0 && friendIds.length > 0) {
            // Service role bypasses RLS to read other users' connections
            const adminClient = createServiceRoleClient();
            const { data: friendConnectionData } = await adminClient
                .from("user_connections")
                .select("user_id, connection_id")
                .in("connection_id", connectionIds)
                .in("user_id", friendIds)
                .is("left_at", null);

            if (friendConnectionData) {
                for (const fc of friendConnectionData) {
                    const profile = friendProfiles[fc.user_id];
                    if (profile) {
                        if (!friendsOnConnections[fc.connection_id]) {
                            friendsOnConnections[fc.connection_id] = [];
                        }
                        friendsOnConnections[fc.connection_id]!.push(profile);
                    }
                }
            }
        }

        // 4. Build response
        const connections = rows.map(row => ({
            id: row.connection_id,
            originStationId: row.origin_station_id,
            originStationName: row.origin_station_name,
            destinationStationId: row.destination_station_id,
            destinationStationName: row.destination_station_name,
            departureTime: row.departure_time,
            arrivalTime: row.arrival_time,
            lineNumber: row.line_number,
            lineType: row.line_type,
            lineColor: row.line_color,
            lineDirection: row.line_direction,
            friends: friendsOnConnections[row.connection_id] ?? [],
        }));

        return NextResponse.json({ connectionIds, connections });
    } catch (error) {
        console.error("Error in GET /api/connections/me:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
