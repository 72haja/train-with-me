import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction, internalMutation } from "./_generated/server";

const assertSecret = (secret: string) => {
    const expected = process.env.MIGRATION_SECRET;

    if (expected === undefined || expected.length === 0) {
        throw new ConvexError("MIGRATION_SECRET is not configured on the Convex deployment");
    }

    if (secret !== expected) {
        throw new ConvexError("Invalid migration secret");
    }
};

const userPayload = v.object({
    supabaseId: v.string(),
    email: v.string(),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
});

const friendshipPayload = v.object({
    userSupabaseId: v.string(),
    friendSupabaseId: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
});

const userConnectionPayload = v.object({
    userSupabaseId: v.string(),
    connectionId: v.string(),
    tripId: v.optional(v.string()),
    joinedAt: v.number(),
    leftAt: v.optional(v.number()),
    originStationId: v.optional(v.string()),
    originStationName: v.optional(v.string()),
    destinationStationId: v.optional(v.string()),
    destinationStationName: v.optional(v.string()),
    departureTime: v.optional(v.string()),
    arrivalTime: v.optional(v.string()),
    lineNumber: v.optional(v.string()),
    lineType: v.optional(v.string()),
    lineColor: v.optional(v.string()),
    lineDirection: v.optional(v.string()),
});

const favoritePayload = v.object({
    userSupabaseId: v.string(),
    originStationId: v.string(),
    destinationStationId: v.string(),
    originStationName: v.optional(v.string()),
    destinationStationName: v.optional(v.string()),
});

export const upsertMigratedUser = internalMutation({
    args: userPayload,
    handler: async (ctx, args): Promise<Id<"users">> => {
        const email = args.email.toLowerCase();
        const existing = await ctx.db
            .query("users")
            .withIndex("email", q => q.eq("email", email))
            .unique();

        if (existing !== null) {
            const patch: { email: string; fullName?: string; name?: string } = {
                email,
            };

            if (args.fullName !== undefined && existing.fullName === undefined) {
                patch.fullName = args.fullName;
                patch.name = args.fullName;
            }

            await ctx.db.patch(existing._id, patch);
            return existing._id;
        }

        return await ctx.db.insert("users", {
            email,
            fullName: args.fullName,
            name: args.fullName,
        });
    },
});

export const attachAvatar = internalMutation({
    args: {
        userId: v.id("users"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, { avatarStorageId: args.storageId });
    },
});

export const importAvatar = internalAction({
    args: { userId: v.id("users"), avatarUrl: v.string() },
    handler: async (ctx, args) => {
        const response = await fetch(args.avatarUrl);

        if (!response.ok) {
            return null;
        }

        const blob = await response.blob();
        const storageId = await ctx.storage.store(blob);

        await ctx.runMutation(internal.migration.attachAvatar, {
            userId: args.userId,
            storageId,
        });

        return storageId;
    },
});

export const upsertFriendship = internalMutation({
    args: v.object({
        userId: v.id("users"),
        friendId: v.id("users"),
        status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
    }),
    handler: async (ctx, args) => {
        const forward = await ctx.db
            .query("friendships")
            .withIndex("by_user_and_friend", q =>
                q.eq("userId", args.userId).eq("friendId", args.friendId)
            )
            .unique();

        if (forward !== null) {
            await ctx.db.patch(forward._id, { status: args.status });
            return forward._id;
        }

        const reverse = await ctx.db
            .query("friendships")
            .withIndex("by_user_and_friend", q =>
                q.eq("userId", args.friendId).eq("friendId", args.userId)
            )
            .unique();

        if (reverse !== null) {
            await ctx.db.patch(reverse._id, { status: args.status });
            return reverse._id;
        }

        return await ctx.db.insert("friendships", {
            userId: args.userId,
            friendId: args.friendId,
            status: args.status,
        });
    },
});

export const upsertUserConnection = internalMutation({
    args: v.object({
        userId: v.id("users"),
        connectionId: v.string(),
        tripId: v.optional(v.string()),
        joinedAt: v.number(),
        leftAt: v.optional(v.number()),
        originStationId: v.optional(v.string()),
        originStationName: v.optional(v.string()),
        destinationStationId: v.optional(v.string()),
        destinationStationName: v.optional(v.string()),
        departureTime: v.optional(v.string()),
        arrivalTime: v.optional(v.string()),
        lineNumber: v.optional(v.string()),
        lineType: v.optional(v.string()),
        lineColor: v.optional(v.string()),
        lineDirection: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("userConnections")
            .withIndex("by_user_and_connection", q =>
                q.eq("userId", args.userId).eq("connectionId", args.connectionId)
            )
            .unique();

        if (existing !== null) {
            await ctx.db.patch(existing._id, args);
            return existing._id;
        }

        return await ctx.db.insert("userConnections", args);
    },
});

export const upsertFavorite = internalMutation({
    args: v.object({
        userId: v.id("users"),
        originStationId: v.string(),
        destinationStationId: v.string(),
        originStationName: v.optional(v.string()),
        destinationStationName: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("favoriteConnections")
            .withIndex("by_user_and_route", q =>
                q
                    .eq("userId", args.userId)
                    .eq("originStationId", args.originStationId)
                    .eq("destinationStationId", args.destinationStationId)
            )
            .unique();

        if (existing !== null) {
            await ctx.db.patch(existing._id, args);
            return existing._id;
        }

        return await ctx.db.insert("favoriteConnections", args);
    },
});

type UserMap = Record<string, Id<"users">>;

export const importAll = action({
    args: {
        secret: v.string(),
        users: v.array(userPayload),
        friendships: v.array(friendshipPayload),
        userConnections: v.array(userConnectionPayload),
        favorites: v.array(favoritePayload),
    },
    handler: async (
        ctx,
        args
    ): Promise<{
        users: number;
        avatars: number;
        friendships: number;
        userConnections: number;
        favorites: number;
    }> => {
        assertSecret(args.secret);

        const userMap: UserMap = {};
        let avatars = 0;

        for (const user of args.users) {
            const id: Id<"users"> = await ctx.runMutation(internal.migration.upsertMigratedUser, {
                supabaseId: user.supabaseId,
                email: user.email,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
            });

            userMap[user.supabaseId] = id;

            if (user.avatarUrl !== undefined) {
                const storageId = await ctx.runAction(internal.migration.importAvatar, {
                    userId: id,
                    avatarUrl: user.avatarUrl,
                });

                if (storageId !== null) {
                    avatars += 1;
                }
            }
        }

        let friendships = 0;

        for (const friendship of args.friendships) {
            const userId = userMap[friendship.userSupabaseId];
            const friendId = userMap[friendship.friendSupabaseId];

            if (userId === undefined || friendId === undefined) {
                continue;
            }

            await ctx.runMutation(internal.migration.upsertFriendship, {
                userId,
                friendId,
                status: friendship.status,
            });
            friendships += 1;
        }

        let userConnections = 0;

        for (const conn of args.userConnections) {
            const userId = userMap[conn.userSupabaseId];

            if (userId === undefined) {
                continue;
            }

            await ctx.runMutation(internal.migration.upsertUserConnection, {
                userId,
                connectionId: conn.connectionId,
                tripId: conn.tripId,
                joinedAt: conn.joinedAt,
                leftAt: conn.leftAt,
                originStationId: conn.originStationId,
                originStationName: conn.originStationName,
                destinationStationId: conn.destinationStationId,
                destinationStationName: conn.destinationStationName,
                departureTime: conn.departureTime,
                arrivalTime: conn.arrivalTime,
                lineNumber: conn.lineNumber,
                lineType: conn.lineType,
                lineColor: conn.lineColor,
                lineDirection: conn.lineDirection,
            });
            userConnections += 1;
        }

        let favorites = 0;

        for (const favorite of args.favorites) {
            const userId = userMap[favorite.userSupabaseId];

            if (userId === undefined) {
                continue;
            }

            await ctx.runMutation(internal.migration.upsertFavorite, {
                userId,
                originStationId: favorite.originStationId,
                destinationStationId: favorite.destinationStationId,
                originStationName: favorite.originStationName,
                destinationStationName: favorite.destinationStationName,
            });
            favorites += 1;
        }

        return {
            users: args.users.length,
            avatars,
            friendships,
            userConnections,
            favorites,
        };
    },
});
