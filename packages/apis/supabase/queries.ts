/**
 * Supabase Database Queries
 *
 * This module contains all database queries for the VVS Together application.
 * In production, these would be actual Supabase queries.
 */
import type { Friend } from "@/types/vvs";
import { getSupabaseClient } from "./client";

/**
 * Get current user's friends
 */
export async function getFriends(userId: string): Promise<Friend[]> {
    const supabaseClient = getSupabaseClient();

    const { data, error } = await supabaseClient
        .from("friendships")
        .select(
            `
      friend:profiles!friend_id (
        id,
        full_name,
        avatar_url
      )
    `
        )
        .eq("user_id", userId)
        .eq("status", "accepted");

    if (error) {
        console.error("Error fetching friends:", error);
        return [];
    }

    // Transform to Friend type
    return (data || [])
        .flatMap(item => item.friend)
        .map(item => ({
            id: item.id,
            name: item.full_name,
            avatarUrl: item.avatar_url,
            isOnline: false, // Would be determined by Supabase presence
        }));
}

/**
 * Get friends on a specific connection
 */
export async function getFriendsOnConnection(
    userId: string,
    connectionId: string
): Promise<Friend[]> {
    // First, get user's friends
    const supabaseClient = getSupabaseClient();

    const friends = await getFriends(userId);
    const friendIds = friends.map(f => f.id);

    // Then, get which friends are on this connection
    const { data, error } = await supabaseClient
        .from("user_connections")
        .select("user_id")
        .eq("connection_id", connectionId)
        .is("left_at", null)
        .in("user_id", friendIds);

    if (error) {
        console.error("Error fetching friends on connection:", error);
        return [];
    }

    const friendsOnConnection = (data || []).map(item => item.user_id);

    return friends.filter(f => friendsOnConnection.includes(f.id));
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
