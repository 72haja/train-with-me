import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@apis/supabase/client";

/**
 * GET /api/friends
 * Get current user's friends
 */
export async function GET(_request: NextRequest) {
    try {
        const supabase = getSupabaseClient();

        // Get current user from session
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get accepted friendships where user is either requester or recipient
        const { data, error } = await supabase
            .from("friendships")
            .select(
                `
                id,
                user_id,
                friend_id,
                status,
                created_at,
                requester:profiles!user_id (
                    id,
                    full_name,
                    avatar_url
                ),
                recipient:profiles!friend_id (
                    id,
                    full_name,
                    avatar_url
                )
            `
            )
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq("status", "accepted");

        if (error) {
            console.error("Error fetching friends:", error);
            return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
        }

        // Transform to friend list (get the other user in each friendship)
        const friends = (data || []).map(friendship => {
            // Supabase returns arrays for joined relations, get first item
            const requester = Array.isArray(friendship.requester)
                ? friendship.requester[0]
                : friendship.requester;
            const recipient = Array.isArray(friendship.recipient)
                ? friendship.recipient[0]
                : friendship.recipient;

            const friend = friendship.user_id === user.id ? recipient : requester;

            return {
                id: friend?.id || "",
                name: friend?.full_name || "Unknown",
                avatarUrl: friend?.avatar_url || null,
                friendshipId: friendship.id,
            };
        });

        return NextResponse.json({
            success: true,
            data: friends,
        });
    } catch (error) {
        console.error("Error in GET /api/friends:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";
