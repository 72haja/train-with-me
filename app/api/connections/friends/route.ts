import { NextRequest, NextResponse } from "next/server";
import type { FriendOnConnection } from "@/packages/types/lib/types";
import { createServerSupabaseClient, createServiceRoleClient } from "@apis/supabase/server";

/**
 * POST /api/connections/friends
 * Given a list of tripIds (physical trains), returns which friends are on each trip.
 * Also accepts connectionIds for backward compatibility, but tripId-based matching is preferred.
 * Body: { tripIds: string[], connectionIds?: string[] }
 *
 * Returns: { friends: Record<tripId, FriendOnConnection[]> }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const tripIds: string[] = body.tripIds ?? [];

        if (tripIds.length === 0) {
            return NextResponse.json({ friends: {} });
        }

        // 1. Get user's friends
        const { data: friendships } = await supabase
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

        if (!friendships || friendships.length === 0) {
            return NextResponse.json({ friends: {} });
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
            return NextResponse.json({ friends: {} });
        }

        // 2. Check which friends are on trips with matching trip_id (service role bypasses RLS)
        const adminClient = createServiceRoleClient();
        const { data: friendConnections } = await adminClient
            .from("user_connections")
            .select(
                "user_id, connection_id, trip_id, origin_station_name, destination_station_name, departure_time, arrival_time"
            )
            .in("trip_id", tripIds)
            .in("user_id", friendIds)
            .is("left_at", null);

        // 3. Group by trip_id
        const friends: Record<string, FriendOnConnection[]> = {};

        for (const fc of friendConnections ?? []) {
            const profile = friendProfiles[fc.user_id];
            if (profile && fc.trip_id) {
                if (!friends[fc.trip_id]) {
                    friends[fc.trip_id] = [];
                }
                friends[fc.trip_id]!.push({
                    ...profile,
                    originStationName: fc.origin_station_name,
                    destinationStationName: fc.destination_station_name,
                    departureTime: fc.departure_time,
                    arrivalTime: fc.arrival_time,
                });
            }
        }

        return NextResponse.json({ friends });
    } catch (error) {
        console.error("Error in POST /api/connections/friends:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
