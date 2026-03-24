import { NextRequest, NextResponse, connection } from "next/server";
import type { FriendOnConnection } from "@/packages/types/lib/types";
import { createServerSupabaseClient, createServiceRoleClient } from "@apis/supabase/server";

/**
 * GET /api/connections/[id]/friends?tripId=...
 * Returns friends of the current user who are on the same physical train (matched by trip_id).
 * Falls back to connection_id matching if no tripId query param is provided.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await connection();
    try {
        const { id: connectionId } = await params;
        const tripId = request.nextUrl.searchParams.get("tripId");
        const supabase = await createServerSupabaseClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get user's friends
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

        if (friendsError || !friendships) {
            return NextResponse.json({ friends: [] });
        }

        const friendProfiles: Record<
            string,
            { id: string; name: string; avatarUrl: string | null }
        > = {};

        for (const f of friendships) {
            const requester = Array.isArray(f.requester) ? f.requester[0] : f.requester;
            const recipient = Array.isArray(f.recipient) ? f.recipient[0] : f.recipient;
            const friend = f.user_id === user.id ? recipient : requester;
            if (friend?.id) {
                friendProfiles[friend.id] = {
                    id: friend.id,
                    name: friend.full_name || "Unknown",
                    avatarUrl: friend.avatar_url || null,
                };
            }
        }

        const friendIds = Object.keys(friendProfiles);

        if (friendIds.length === 0) {
            return NextResponse.json({ friends: [] });
        }

        // 2. Check which friends are on this trip (service role bypasses RLS)
        const adminClient = createServiceRoleClient();

        let query = adminClient
            .from("user_connections")
            .select(
                "user_id, connection_id, trip_id, origin_station_name, destination_station_name, departure_time, arrival_time"
            )
            .in("user_id", friendIds)
            .is("left_at", null);

        // Prefer trip_id matching (same physical train, any boarding station)
        // Fall back to connection_id matching for backward compatibility
        if (tripId) {
            query = query.eq("trip_id", tripId);
        } else {
            query = query.eq("connection_id", connectionId);
        }

        const { data: friendConnections } = await query;

        const friends: FriendOnConnection[] = [];
        for (const fc of friendConnections ?? []) {
            const profile = friendProfiles[fc.user_id];
            if (profile) {
                friends.push({
                    id: profile.id,
                    name: profile.name,
                    avatarUrl: profile.avatarUrl,
                    originStationName: fc.origin_station_name,
                    destinationStationName: fc.destination_station_name,
                    departureTime: fc.departure_time,
                    arrivalTime: fc.arrival_time,
                });
            }
        }

        return NextResponse.json({ friends });
    } catch (error) {
        console.error("Error in GET /api/connections/[id]/friends:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
