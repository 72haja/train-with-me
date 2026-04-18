import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

export type MyConnection = {
    id: string;
    originStationId: string | null;
    originStationName: string | null;
    destinationStationId: string | null;
    destinationStationName: string | null;
    departureTime: string | null;
    arrivalTime: string | null;
    lineNumber: string | null;
    lineType: string | null;
    lineColor: string | null;
    lineDirection: string | null;
    tripId: string | null;
    friends: Array<{
        id: Id<"users">;
        name: string;
        avatarUrl: string | null;
        isOnline: boolean;
        originStationName: string | null;
        destinationStationName: string | null;
        departureTime: string | null;
        arrivalTime: string | null;
    }>;
};

const collectFriendIds = async (ctx: QueryCtx, userId: Id<"users">): Promise<Id<"users">[]> => {
    const asRequester = await ctx.db
        .query("friendships")
        .withIndex("by_user_and_status", q => q.eq("userId", userId).eq("status", "accepted"))
        .collect();

    const asRecipient = await ctx.db
        .query("friendships")
        .withIndex("by_friend_and_status", q => q.eq("friendId", userId).eq("status", "accepted"))
        .collect();

    const ids = new Set<Id<"users">>();

    for (const f of asRequester) {
        ids.add(f.friendId);
    }
    for (const f of asRecipient) {
        ids.add(f.userId);
    }

    return Array.from(ids);
};

const buildFriendProfileMap = async (
    ctx: QueryCtx,
    friendIds: Id<"users">[]
): Promise<Record<string, { id: Id<"users">; name: string; avatarUrl: string | null }>> => {
    const entries = await Promise.all(
        friendIds.map(async id => {
            const user = await ctx.db.get(id);

            if (user === null) {
                return null;
            }

            const avatarUrl = user.avatarStorageId
                ? await ctx.storage.getUrl(user.avatarStorageId)
                : null;

            return {
                id,
                profile: {
                    id,
                    name: user.fullName ?? user.name ?? user.email ?? "Unknown",
                    avatarUrl,
                },
            };
        })
    );

    const map: Record<string, { id: Id<"users">; name: string; avatarUrl: string | null }> = {};

    for (const entry of entries) {
        if (entry !== null) {
            map[entry.id] = entry.profile;
        }
    }

    return map;
};

const isInPast = (row: Doc<"userConnections">, nowMs: number): boolean => {
    const timeStr = row.arrivalTime ?? row.departureTime;

    if (!timeStr) {
        return false;
    }

    const ms = Date.parse(timeStr);

    if (Number.isNaN(ms)) {
        return false;
    }

    return ms < nowMs;
};

export const listMine = query({
    args: {},
    handler: async (ctx): Promise<{ connectionIds: string[]; connections: MyConnection[] }> => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            return { connectionIds: [], connections: [] };
        }

        const active = await ctx.db
            .query("userConnections")
            .withIndex("by_user_and_left", q => q.eq("userId", userId).eq("leftAt", undefined))
            .collect();

        const now = Date.now();
        const rows = active.filter(row => !isInPast(row, now));

        const tripIds = rows.map(row => row.tripId).filter((id): id is string => id !== undefined);

        const friendIds = await collectFriendIds(ctx, userId);
        const friendProfiles = await buildFriendProfileMap(ctx, friendIds);

        const friendsOnTrips: Record<string, MyConnection["friends"]> = {};

        if (tripIds.length > 0 && friendIds.length > 0) {
            const uniqueTripIds = Array.from(new Set(tripIds));
            const friendIdSet = new Set(friendIds);

            for (const tripId of uniqueTripIds) {
                const matches = await ctx.db
                    .query("userConnections")
                    .withIndex("by_trip", q => q.eq("tripId", tripId))
                    .collect();

                for (const match of matches) {
                    if (match.leftAt !== undefined) {
                        continue;
                    }
                    if (!friendIdSet.has(match.userId)) {
                        continue;
                    }
                    const profile = friendProfiles[match.userId];
                    if (profile === undefined) {
                        continue;
                    }

                    if (friendsOnTrips[tripId] === undefined) {
                        friendsOnTrips[tripId] = [];
                    }

                    friendsOnTrips[tripId]!.push({
                        id: profile.id,
                        name: profile.name,
                        avatarUrl: profile.avatarUrl,
                        isOnline: false,
                        originStationName: match.originStationName ?? null,
                        destinationStationName: match.destinationStationName ?? null,
                        departureTime: match.departureTime ?? null,
                        arrivalTime: match.arrivalTime ?? null,
                    });
                }
            }
        }

        const connections: MyConnection[] = rows.map(row => ({
            id: row.connectionId,
            originStationId: row.originStationId ?? null,
            originStationName: row.originStationName ?? null,
            destinationStationId: row.destinationStationId ?? null,
            destinationStationName: row.destinationStationName ?? null,
            departureTime: row.departureTime ?? null,
            arrivalTime: row.arrivalTime ?? null,
            lineNumber: row.lineNumber ?? null,
            lineType: row.lineType ?? null,
            lineColor: row.lineColor ?? null,
            lineDirection: row.lineDirection ?? null,
            tripId: row.tripId ?? null,
            friends: row.tripId ? (friendsOnTrips[row.tripId] ?? []) : [],
        }));

        return {
            connectionIds: connections.map(c => c.id),
            connections,
        };
    },
});

export const friendsOnTrips = query({
    args: { tripIds: v.array(v.string()) },
    handler: async (ctx, args): Promise<Record<string, MyConnection["friends"]>> => {
        const userId = await getAuthUserId(ctx);

        if (userId === null || args.tripIds.length === 0) {
            return {};
        }

        const friendIds = await collectFriendIds(ctx, userId);

        if (friendIds.length === 0) {
            return {};
        }

        const friendProfiles = await buildFriendProfileMap(ctx, friendIds);
        const friendIdSet = new Set(friendIds);
        const result: Record<string, MyConnection["friends"]> = {};

        for (const tripId of args.tripIds) {
            const matches = await ctx.db
                .query("userConnections")
                .withIndex("by_trip", q => q.eq("tripId", tripId))
                .collect();

            for (const match of matches) {
                if (match.leftAt !== undefined) {
                    continue;
                }
                if (!friendIdSet.has(match.userId)) {
                    continue;
                }
                const profile = friendProfiles[match.userId];
                if (profile === undefined) {
                    continue;
                }

                if (result[tripId] === undefined) {
                    result[tripId] = [];
                }

                result[tripId]!.push({
                    id: profile.id,
                    name: profile.name,
                    avatarUrl: profile.avatarUrl,
                    isOnline: false,
                    originStationName: match.originStationName ?? null,
                    destinationStationName: match.destinationStationName ?? null,
                    departureTime: match.departureTime ?? null,
                    arrivalTime: match.arrivalTime ?? null,
                });
            }
        }

        return result;
    },
});

export const friendsOnConnection = query({
    args: {
        connectionId: v.string(),
        tripId: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<MyConnection["friends"]> => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            return [];
        }

        const friendIds = await collectFriendIds(ctx, userId);

        if (friendIds.length === 0) {
            return [];
        }

        const friendProfiles = await buildFriendProfileMap(ctx, friendIds);
        const friendIdSet = new Set(friendIds);

        let matches: Doc<"userConnections">[];

        if (args.tripId !== undefined) {
            matches = await ctx.db
                .query("userConnections")
                .withIndex("by_trip", q => q.eq("tripId", args.tripId))
                .collect();
        } else {
            matches = [];
            for (const friendId of friendIds) {
                const friendRows = await ctx.db
                    .query("userConnections")
                    .withIndex("by_user_and_connection", q =>
                        q.eq("userId", friendId).eq("connectionId", args.connectionId)
                    )
                    .collect();
                matches.push(...friendRows);
            }
        }

        const result: MyConnection["friends"] = [];

        for (const match of matches) {
            if (match.leftAt !== undefined) {
                continue;
            }
            if (!friendIdSet.has(match.userId)) {
                continue;
            }
            const profile = friendProfiles[match.userId];
            if (profile === undefined) {
                continue;
            }

            result.push({
                id: profile.id,
                name: profile.name,
                avatarUrl: profile.avatarUrl,
                isOnline: false,
                originStationName: match.originStationName ?? null,
                destinationStationName: match.destinationStationName ?? null,
                departureTime: match.departureTime ?? null,
                arrivalTime: match.arrivalTime ?? null,
            });
        }

        return result;
    },
});

export const join = mutation({
    args: {
        connectionId: v.string(),
        tripId: v.optional(v.string()),
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
    },
    handler: async (ctx, args): Promise<Id<"userConnections">> => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        return await ctx.db.insert("userConnections", {
            userId,
            connectionId: args.connectionId,
            tripId: args.tripId,
            joinedAt: Date.now(),
            leftAt: undefined,
            originStationId: args.originStationId,
            originStationName: args.originStationName,
            destinationStationId: args.destinationStationId,
            destinationStationName: args.destinationStationName,
            departureTime: args.departureTime,
            arrivalTime: args.arrivalTime,
            lineNumber: args.lineNumber,
            lineType: args.lineType,
            lineColor: args.lineColor,
            lineDirection: args.lineDirection,
        });
    },
});

export const leave = mutation({
    args: { connectionId: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        const rows = await ctx.db
            .query("userConnections")
            .withIndex("by_user_and_connection", q =>
                q.eq("userId", userId).eq("connectionId", args.connectionId)
            )
            .collect();

        const now = Date.now();

        for (const row of rows) {
            if (row.leftAt === undefined) {
                await ctx.db.patch(row._id, { leftAt: now });
            }
        }

        return null;
    },
});

export const cleanupPast = mutation({
    args: {},
    handler: async (ctx: MutationCtx) => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            return null;
        }

        const active = await ctx.db
            .query("userConnections")
            .withIndex("by_user_and_left", q => q.eq("userId", userId).eq("leftAt", undefined))
            .collect();

        const now = Date.now();

        for (const row of active) {
            if (isInPast(row, now)) {
                await ctx.db.patch(row._id, { leftAt: now });
            }
        }

        return null;
    },
});
