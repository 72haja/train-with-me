import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

type FriendListEntry = {
    friendshipId: Id<"friendships">;
    id: Id<"users">;
    name: string;
    avatarUrl: string | null;
    isOnline: boolean;
};

type FriendRequestEntry = {
    id: Id<"friendships">;
    type: "received" | "sent";
    user: {
        id: Id<"users">;
        name: string;
        avatarUrl: string | null;
        email: string;
    };
    createdAt: number;
};

const toFriendSummary = async (
    ctx: QueryCtx,
    user: Doc<"users">
): Promise<{ name: string; avatarUrl: string | null }> => {
    const avatarUrl = user.avatarStorageId ? await ctx.storage.getUrl(user.avatarStorageId) : null;

    return {
        name: user.fullName ?? user.name ?? user.email ?? "Unknown",
        avatarUrl,
    };
};

const findExistingFriendship = async (
    ctx: QueryCtx,
    a: Id<"users">,
    b: Id<"users">
): Promise<Doc<"friendships"> | null> => {
    const forward = await ctx.db
        .query("friendships")
        .withIndex("by_user_and_friend", q => q.eq("userId", a).eq("friendId", b))
        .unique();

    if (forward !== null) {
        return forward;
    }

    return await ctx.db
        .query("friendships")
        .withIndex("by_user_and_friend", q => q.eq("userId", b).eq("friendId", a))
        .unique();
};

export const list = query({
    args: {},
    handler: async (ctx): Promise<FriendListEntry[]> => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            return [];
        }

        const asRequester = await ctx.db
            .query("friendships")
            .withIndex("by_user_and_status", q => q.eq("userId", userId).eq("status", "accepted"))
            .collect();

        const asRecipient = await ctx.db
            .query("friendships")
            .withIndex("by_friend_and_status", q =>
                q.eq("friendId", userId).eq("status", "accepted")
            )
            .collect();

        const friendships = [...asRequester, ...asRecipient];

        const results: Array<FriendListEntry | null> = await Promise.all(
            friendships.map(async (friendship): Promise<FriendListEntry | null> => {
                const otherId =
                    friendship.userId === userId ? friendship.friendId : friendship.userId;
                const other = await ctx.db.get(otherId);

                if (other === null) {
                    return null;
                }

                const summary = await toFriendSummary(ctx, other);

                return {
                    friendshipId: friendship._id,
                    id: other._id,
                    name: summary.name,
                    avatarUrl: summary.avatarUrl,
                    isOnline: false,
                };
            })
        );

        return results.filter((entry): entry is FriendListEntry => entry !== null);
    },
});

export const listRequests = query({
    args: {},
    handler: async (
        ctx
    ): Promise<{
        received: FriendRequestEntry[];
        sent: FriendRequestEntry[];
    }> => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            return { received: [], sent: [] };
        }

        const receivedRaw = await ctx.db
            .query("friendships")
            .withIndex("by_friend_and_status", q =>
                q.eq("friendId", userId).eq("status", "pending")
            )
            .collect();

        const sentRaw = await ctx.db
            .query("friendships")
            .withIndex("by_user_and_status", q => q.eq("userId", userId).eq("status", "pending"))
            .collect();

        const mapEntry = async (
            friendship: Doc<"friendships">,
            type: "received" | "sent"
        ): Promise<FriendRequestEntry | null> => {
            const otherId = type === "received" ? friendship.userId : friendship.friendId;
            const other = await ctx.db.get(otherId);

            if (other === null) {
                return null;
            }

            const summary = await toFriendSummary(ctx, other);

            return {
                id: friendship._id,
                type,
                user: {
                    id: other._id,
                    name: summary.name,
                    avatarUrl: summary.avatarUrl,
                    email: other.email ?? "",
                },
                createdAt: friendship._creationTime,
            };
        };

        const received = (await Promise.all(receivedRaw.map(f => mapEntry(f, "received")))).filter(
            (e): e is FriendRequestEntry => e !== null
        );

        const sent = (await Promise.all(sentRaw.map(f => mapEntry(f, "sent")))).filter(
            (e): e is FriendRequestEntry => e !== null
        );

        return { received, sent };
    },
});

export const sendRequest = mutation({
    args: { email: v.string() },
    handler: async (ctx, args): Promise<Id<"friendships">> => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        const normalized = args.email.trim().toLowerCase();

        const target = await ctx.db
            .query("users")
            .withIndex("email", q => q.eq("email", normalized))
            .unique();

        if (target === null) {
            throw new ConvexError("User with this email not found");
        }

        if (target._id === userId) {
            throw new ConvexError("Cannot send friend request to yourself");
        }

        const existing = await findExistingFriendship(ctx, userId, target._id);

        if (existing !== null) {
            if (existing.status === "accepted") {
                throw new ConvexError("Already friends with this user");
            }
            if (existing.status === "pending") {
                throw new ConvexError("Friend request already sent");
            }
        }

        return await ctx.db.insert("friendships", {
            userId,
            friendId: target._id,
            status: "pending",
        });
    },
});

export const acceptRequest = mutation({
    args: { friendshipId: v.id("friendships") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        const friendship = await ctx.db.get(args.friendshipId);

        if (friendship === null) {
            throw new ConvexError("Friend request not found");
        }

        if (friendship.friendId !== userId) {
            throw new ConvexError("You can only accept requests sent to you");
        }

        if (friendship.status !== "pending") {
            throw new ConvexError("Friend request is not pending");
        }

        await ctx.db.patch(args.friendshipId, { status: "accepted" });

        return null;
    },
});

export const declineRequest = mutation({
    args: { friendshipId: v.id("friendships") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        const friendship = await ctx.db.get(args.friendshipId);

        if (friendship === null) {
            throw new ConvexError("Friend request not found");
        }

        if (friendship.friendId !== userId) {
            throw new ConvexError("You can only decline requests sent to you");
        }

        if (friendship.status !== "pending") {
            throw new ConvexError("Friend request is not pending");
        }

        await ctx.db.delete(args.friendshipId);

        return null;
    },
});

export const remove = mutation({
    args: { friendshipId: v.id("friendships") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        const friendship = await ctx.db.get(args.friendshipId);

        if (friendship === null) {
            throw new ConvexError("Friendship not found");
        }

        if (friendship.userId !== userId && friendship.friendId !== userId) {
            throw new ConvexError("You can only remove your own friendships");
        }

        if (friendship.status !== "accepted") {
            throw new ConvexError("Friendship is not accepted");
        }

        await ctx.db.delete(args.friendshipId);

        return null;
    },
});
