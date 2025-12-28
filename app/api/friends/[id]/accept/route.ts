import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@apis/supabase/server";

/**
 * POST /api/friends/[id]/accept
 * Accept a friend request
 */
export async function POST(
    request: NextRequest,
    { params }: RouteContext<"/api/friends/[id]/accept">
) {
    unstable_noStore(); // Opt out of static generation before accessing dynamic APIs

    try {
        const supabase = createServerSupabaseClient(request);
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const friendshipId = id;

        // Verify the friendship exists and user is the recipient
        const { data: friendship, error: fetchError } = await supabase
            .from("friendships")
            .select("id, user_id, friend_id, status")
            .eq("id", friendshipId)
            .eq("friend_id", user.id)
            .eq("status", "pending")
            .single();

        if (fetchError || !friendship) {
            return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
        }

        // Update friendship status to accepted
        const { error: updateError } = await supabase
            .from("friendships")
            .update({ status: "accepted" })
            .eq("id", friendshipId);

        if (updateError) {
            console.error("Error accepting friend request:", updateError);
            return NextResponse.json({ error: "Failed to accept friend request" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Friend request accepted",
        });
    } catch (error) {
        // Re-throw PPR errors (errors with digest 'NEXT_PRERENDER_INTERRUPTED')
        if (
            error &&
            typeof error === "object" &&
            "digest" in error &&
            error.digest === "NEXT_PRERENDER_INTERRUPTED"
        ) {
            throw error;
        }
        console.error("Error in POST /api/friends/[id]/accept:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
