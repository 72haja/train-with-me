import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@apis/supabase/client";

/**
 * GET /api/friends/requests
 * Get pending friend requests (both sent and received)
 */
export async function GET(_request: NextRequest) {
    try {
        const supabase = getSupabaseClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
            .eq("friend_id", user.id)
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
            .eq("user_id", user.id)
            .eq("status", "pending");

        if (sentError) {
            console.error("Error fetching sent requests:", sentError);
        }

        // Transform received requests
        const received = (receivedRequests || []).map((request: any) => {
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
        const sent = (sentRequests || []).map((request: any) => {
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

        return NextResponse.json({
            success: true,
            data: {
                received,
                sent,
            },
        });
    } catch (error) {
        console.error("Error in GET /api/friends/requests:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic";

