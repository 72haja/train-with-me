import { unstable_cache, unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@apis/supabase/server";

/**
 * Cached function to fetch user's friends
 * Results are cached per user ID for 2 minutes
 * Uses unstable_cache for request-time caching (doesn't interfere with prerendering)
 */
const getCachedFriends = unstable_cache(
    async (userId: string, supabase: ReturnType<typeof createServerSupabaseClient>) => {
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
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
            .eq("status", "accepted");

        if (error) {
            console.error("Error fetching friends:", error);
            return [];
        }

        // Transform to friend list (get the other user in each friendship)
        return (data || []).map(friendship => {
            // Supabase returns arrays for joined relations, get first item
            const requester = Array.isArray(friendship.requester)
                ? friendship.requester[0]
                : friendship.requester;
            const recipient = Array.isArray(friendship.recipient)
                ? friendship.recipient[0]
                : friendship.recipient;

            const friend = friendship.user_id === userId ? recipient : requester;

            return {
                id: friend?.id || "",
                name: friend?.full_name || "Unknown",
                avatarUrl: friend?.avatar_url || null,
                friendshipId: friendship.id,
            };
        });
    },
    ["friends"],
    {
        revalidate: 120, // Cache for 2 minutes
        tags: ["friends"],
    }
);

/**
 * GET /api/friends
 * Get current user's friends
 */
export async function GET(request: NextRequest) {
    unstable_noStore(); // Opt out of static generation before accessing dynamic APIs

    // Create Supabase client outside try/catch so PPR errors can propagate
    // This allows Next.js to properly handle the static bailout
    const supabase = createServerSupabaseClient(request);

    try {
        // Get current user from session
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Note: We pass the supabase client, but unstable_cache will cache the result
        // per unique userId, so the cookie access happens at request time, not during prerendering
        const friends = await getCachedFriends(user.id, supabase);

        return NextResponse.json({
            success: true,
            data: friends,
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
        console.error("Error in GET /api/friends:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
