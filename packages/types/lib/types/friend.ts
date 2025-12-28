/**
 * Friend-related types
 * Shared types for friend entities across the application
 */

export interface Friend {
    id: string;
    name: string;
    avatarUrl?: string | null;
    /** Online status - in real app, from Supabase presence */
    isOnline?: boolean;
}

export interface FriendRequest {
    id: string;
    type: "received" | "sent";
    user: {
        id: string;
        name: string;
        avatarUrl: string | null;
        email: string;
    };
    createdAt: string;
}

export interface FriendWithFriendshipId extends Friend {
    friendshipId: string;
}

