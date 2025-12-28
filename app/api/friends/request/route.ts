import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@apis/supabase/server";

/**
 * POST /api/friends/request
 * Send a friend request by email
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        // Get current user from session
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { email } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Find user by email in profiles table
        const { data: friendProfile, error: findError } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("email", email.toLowerCase())
            .maybeSingle();

        if (findError) {
            console.error("Error finding user:", findError);
            return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
        }

        if (!friendProfile) {
            return NextResponse.json({ error: "User with this email not found" }, { status: 404 });
        }

        const friendUserId = friendProfile.id;

        if (friendUserId === user.id) {
            return NextResponse.json(
                { error: "Cannot send friend request to yourself" },
                { status: 400 }
            );
        }

        // Check if friendship already exists
        const { data: existingFriendship, error: checkError } = await supabase
            .from("friendships")
            .select("id, status")
            .or(
                `and(user_id.eq.${user.id},friend_id.eq.${friendUserId}),and(user_id.eq.${friendUserId},friend_id.eq.${user.id})`
            )
            .maybeSingle();

        if (checkError && checkError.code !== "PGRST116") {
            console.error("Error checking existing friendship:", checkError);
            return NextResponse.json(
                { error: "Failed to check existing friendship" },
                { status: 500 }
            );
        }

        if (existingFriendship) {
            if (existingFriendship.status === "accepted") {
                return NextResponse.json(
                    { error: "Already friends with this user" },
                    { status: 400 }
                );
            }
            if (existingFriendship.status === "pending") {
                return NextResponse.json({ error: "Friend request already sent" }, { status: 400 });
            }
        }

        // Create friend request
        const { data: friendship, error: insertError } = await supabase
            .from("friendships")
            .insert({
                user_id: user.id,
                friend_id: friendUserId,
                status: "pending",
            })
            .select()
            .single();

        if (insertError) {
            console.error("Error creating friend request:", insertError);
            return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: friendship,
            message: "Friend request sent",
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
        console.error("Error in POST /api/friends/request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
