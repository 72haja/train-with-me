import { unstable_cache, unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@apis/supabase/server";

/**
 * Cached function to fetch friend requests
 * Results are cached per user ID for 30 seconds (requests change more frequently)
 * Uses unstable_cache for request-time caching (doesn't interfere with prerendering)
 */
const getCachedFriendRequests = unstable_cache(
    async (userId: string, supabase: ReturnType<typeof createServerSupabaseClient>) => {
        // Get pending requests where user is the recipient (received requests)
        const { data: receivedRequests, error: receivedError } = await supabase
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
                    avatar_url,
                    email
                )
            `
            )
            .eq("friend_id", userId)
            .eq("status", "pending");

        if (receivedError) {
            console.error("Error fetching received requests:", receivedError);
        }

        // Get pending requests where user is the requester (sent requests)
        const { data: sentRequests, error: sentError } = await supabase
            .from("friendships")
            .select(
                `
                id,
                user_id,
                friend_id,
                status,
                created_at,
                recipient:profiles!friend_id (
                    id,
                    full_name,
                    avatar_url,
                    email
                )
            `
            )
            .eq("user_id", userId)
            .eq("status", "pending");

        if (sentError) {
            console.error("Error fetching sent requests:", sentError);
        }

        // Transform received requests
        const received = (receivedRequests || []).map(request => {
            const requester = Array.isArray(request.requester)
                ? request.requester[0]
                : request.requester;
            return {
                id: request.id,
                type: "received" as const,
                user: {
                    id: requester?.id || "",
                    name: requester?.full_name || "Unknown",
                    avatarUrl: requester?.avatar_url || null,
                    email: requester?.email || "",
                },
                createdAt: request.created_at,
            };
        });

        // Transform sent requests
        const sent = (sentRequests || []).map(request => {
            const recipient = Array.isArray(request.recipient)
                ? request.recipient[0]
                : request.recipient;
            return {
                id: request.id,
                type: "sent" as const,
                user: {
                    id: recipient?.id || "",
                    name: recipient?.full_name || "Unknown",
                    avatarUrl: recipient?.avatar_url || null,
                    email: recipient?.email || "",
                },
                createdAt: request.created_at,
            };
        });

        return {
            received,
            sent,
        };
    },
    ["friend-requests"],
    {
        revalidate: 30, // Cache for 30 seconds
        tags: ["friend-requests"],
    }
);

/**
 * GET /api/friends/requests
 * Get pending friend requests (both sent and received)
 */
export async function GET(request: NextRequest) {
    unstable_noStore(); // Opt out of static generation before accessing dynamic APIs

    // Create Supabase client outside try/catch so PPR errors can propagate
    // This allows Next.js to properly handle the static bailout
    const supabase = createServerSupabaseClient(request);

    try {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await getCachedFriendRequests(user.id, supabase);

        return NextResponse.json({
            success: true,
            data,
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
        console.error("Error in GET /api/friends/requests:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
