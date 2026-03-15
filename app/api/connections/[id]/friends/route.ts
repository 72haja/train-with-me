import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@apis/supabase/server";

/**
 * GET /api/connections/[id]/friends
 * Returns friends of the current user who are also on this connection.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: connectionId } = await params;
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

        // 2. Check which friends are on this connection (service role bypasses RLS)
        const adminClient = createServiceRoleClient();
        const { data: friendConnections } = await adminClient
            .from("user_connections")
            .select("user_id, connection_id")
            .eq("connection_id", connectionId)
            .in("user_id", friendIds)
            .is("left_at", null);

        const friends = (friendConnections ?? [])
            .map(fc => friendProfiles[fc.user_id])
            .filter(Boolean);

        return NextResponse.json({ friends });
    } catch (error) {
        console.error("Error in GET /api/connections/[id]/friends:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
