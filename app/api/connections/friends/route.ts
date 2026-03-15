import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@apis/supabase/server";

/**
 * POST /api/connections/friends
 * Given a list of connection IDs, returns which friends are on each connection.
 * Body: { connectionIds: string[] }
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
        const connectionIds: string[] = body.connectionIds ?? [];

        if (connectionIds.length === 0) {
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

        // 2. Check which friends are on which connections (service role bypasses RLS)
        const adminClient = createServiceRoleClient();
        const { data: friendConnections } = await adminClient
            .from("user_connections")
            .select("user_id, connection_id")
            .in("connection_id", connectionIds)
            .in("user_id", friendIds)
            .is("left_at", null);

        // 3. Group by connection ID
        const friends: Record<string, { id: string; name: string; avatarUrl: string | null }[]> =
            {};

        for (const fc of friendConnections ?? []) {
            const profile = friendProfiles[fc.user_id];
            if (profile) {
                if (!friends[fc.connection_id]) {
                    friends[fc.connection_id] = [];
                }
                friends[fc.connection_id]!.push(profile);
            }
        }

        return NextResponse.json({ friends });
    } catch (error) {
        console.error("Error in POST /api/connections/friends:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
