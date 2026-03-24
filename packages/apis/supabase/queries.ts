/**
 * Supabase Database Queries
 *
 * This module contains all database queries for the VVS Together application.
 * In production, these would be actual Supabase queries.
 */
import { unstable_cache } from "next/cache";
import type { Friend, FriendOnConnection } from "@/packages/types/lib/types";
import { getSupabaseClient } from "./client";

/**
 * Get current user's friends
 * Results are cached per user ID for 2 minutes
 * Note: This uses the client-side Supabase client, so it's safe for client components
 */
export async function getFriends(userId: string): Promise<Friend[]> {
    const supabaseClient = getSupabaseClient();

    // Use unstable_cache for request-time caching
    return unstable_cache(
        async () => {
            // Get accepted friendships where user is either requester or recipient
            const { data, error } = await supabaseClient
                .from("friendships")
                .select(
                    `
                    id,
                    user_id,
                    friend_id,
                    friend:profiles!friend_id (
                        id,
                        full_name,
                        avatar_url
                    ),
                    requester:profiles!user_id (
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

            // Transform to Friend type - get the other user in each friendship
            return (data || [])
                .map(friendship => {
                    const friend =
                        friendship.user_id === userId
                            ? (friendship.friend ?? null)
                            : (friendship.requester ?? null);

                    return {
                        id: friend?.id || "",
                        name: friend?.full_name || "Unknown",
                        avatarUrl: friend?.avatar_url || undefined,
                        isOnline: false, // Would be determined by Supabase presence
                    };
                })
                .filter((friend: Friend) => friend.id !== ""); // Filter out invalid entries
        },
        [`friends-${userId}`],
        {
            revalidate: 120, // Cache for 2 minutes
            tags: ["friends"],
        }
    )();
}

/**
 * Get friends on the same physical train (trip_id match).
 * Falls back to connection_id matching if no tripId is provided.
 * Results are cached per user ID and tripId/connectionId for 30 seconds.
 */
export async function getFriendsOnConnection(
    userId: string,
    connectionId: string,
    tripId?: string
): Promise<FriendOnConnection[]> {
    const cacheKey = tripId
        ? `friends-on-trip-${userId}-${tripId}`
        : `friends-on-connection-${userId}-${connectionId}`;

    return unstable_cache(
        async () => {
            const supabaseClient = getSupabaseClient();

            const friends = await getFriends(userId);
            const friendIds = friends.map(f => f.id);

            // Build query: prefer trip_id for same-train matching
            let query = supabaseClient
                .from("user_connections")
                .select(
                    "user_id, origin_station_name, destination_station_name, departure_time, arrival_time"
                )
                .is("left_at", null)
                .in("user_id", friendIds);

            if (tripId) {
                query = query.eq("trip_id", tripId);
            } else {
                query = query.eq("connection_id", connectionId);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching friends on connection:", error);
                return [];
            }

            const friendMap = new Map(friends.map(f => [f.id, f]));

            return (data || [])
                .map(item => {
                    const friend = friendMap.get(item.user_id);
                    if (!friend) {
                        return null;
                    }
                    return {
                        ...friend,
                        originStationName: item.origin_station_name,
                        destinationStationName: item.destination_station_name,
                        departureTime: item.departure_time,
                        arrivalTime: item.arrival_time,
                    } as FriendOnConnection;
                })
                .filter((f): f is FriendOnConnection => f !== null);
        },
        [cacheKey],
        {
            revalidate: 30,
            tags: ["friends", "connections"],
        }
    )();
}

/**
 * Join a connection
 */
export async function joinConnection(userId: string, connectionId: string): Promise<boolean> {
    const supabaseClient = getSupabaseClient();

    const { error } = await supabaseClient.from("user_connections").insert({
        user_id: userId,
        connection_id: connectionId,
    });

    if (error) {
        console.error("Error joining connection:", error);
        return false;
    }

    return true;
}

/**
 * Leave a connection
 */
export async function leaveConnection(userId: string, connectionId: string): Promise<boolean> {
    const supabaseClient = getSupabaseClient();

    const { error } = await supabaseClient
        .from("user_connections")
        .update({ left_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("connection_id", connectionId)
        .is("left_at", null);

    if (error) {
        console.error("Error leaving connection:", error);
        return false;
    }

    return true;
}
