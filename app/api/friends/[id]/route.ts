import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@apis/supabase/server";

/**
 * DELETE /api/friends/[id]
 * Remove a friend (delete friendship)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        // Verify the friendship exists and user is part of it
        const { data: friendship, error: fetchError } = await supabase
            .from("friendships")
            .select("id, user_id, friend_id, status")
            .eq("id", friendshipId)
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq("status", "accepted")
            .single();

        if (fetchError || !friendship) {
            return NextResponse.json(
                { error: "Friendship not found" },
                { status: 404 }
            );
        }

        // Delete the friendship
        const { error: deleteError } = await supabase
            .from("friendships")
            .delete()
            .eq("id", friendshipId);

        if (deleteError) {
            console.error("Error removing friend:", deleteError);
            return NextResponse.json(
                { error: "Failed to remove friend" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Friend removed",
        });
    } catch (error) {
        console.error("Error in DELETE /api/friends/[id]:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic";

