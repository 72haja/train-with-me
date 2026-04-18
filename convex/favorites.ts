import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";

type FavoriteRow = {
    id: Id<"favoriteConnections">;
    userId: Id<"users">;
    originStationId: string;
    destinationStationId: string;
    originStationName: string | null;
    destinationStationName: string | null;
    createdAt: number;
};

export const list = query({
    args: {},
    handler: async (ctx): Promise<FavoriteRow[]> => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            return [];
        }

        const rows = await ctx.db
            .query("favoriteConnections")
            .withIndex("by_user", q => q.eq("userId", userId))
            .order("desc")
            .collect();

        return rows.map(row => ({
            id: row._id,
            userId: row.userId,
            originStationId: row.originStationId,
            destinationStationId: row.destinationStationId,
            originStationName: row.originStationName ?? null,
            destinationStationName: row.destinationStationName ?? null,
            createdAt: row._creationTime,
        }));
    },
});

export const findExisting = internalQuery({
    args: {
        userId: v.id("users"),
        originStationId: v.string(),
        destinationStationId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("favoriteConnections")
            .withIndex("by_user_and_route", q =>
                q
                    .eq("userId", args.userId)
                    .eq("originStationId", args.originStationId)
                    .eq("destinationStationId", args.destinationStationId)
            )
            .unique();
    },
});

export const insert = internalMutation({
    args: {
        userId: v.id("users"),
        originStationId: v.string(),
        destinationStationId: v.string(),
        originStationName: v.optional(v.string()),
        destinationStationName: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<FavoriteRow> => {
        const id = await ctx.db.insert("favoriteConnections", {
            userId: args.userId,
            originStationId: args.originStationId,
            destinationStationId: args.destinationStationId,
            originStationName: args.originStationName,
            destinationStationName: args.destinationStationName,
        });

        const row = await ctx.db.get(id);

        if (row === null) {
            throw new ConvexError("Failed to fetch inserted favorite");
        }

        return {
            id: row._id,
            userId: row.userId,
            originStationId: row.originStationId,
            destinationStationId: row.destinationStationId,
            originStationName: row.originStationName ?? null,
            destinationStationName: row.destinationStationName ?? null,
            createdAt: row._creationTime,
        };
    },
});

type EfaStopFinderResponse = {
    points?: {
        point?: Array<{ name?: string; stopName?: string }>;
    };
};

const fetchStationName = async (stopId: string): Promise<string | null> => {
    try {
        const url = new URL("https://efastatic.vvs.de/umweltrechner/XML_STOPFINDER_REQUEST");
        url.searchParams.set("outputFormat", "JSON");
        url.searchParams.set("type_sf", "stop");
        url.searchParams.set("name_sf", stopId);
        url.searchParams.set("anyObjFilter_sf", "3");

        const response = await fetch(url.toString());

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as EfaStopFinderResponse;
        const first = data.points?.point?.[0];
        return first?.name ?? first?.stopName ?? null;
    } catch {
        return null;
    }
};

export const add = action({
    args: {
        originStationId: v.string(),
        destinationStationId: v.string(),
    },
    handler: async (ctx, args): Promise<FavoriteRow> => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        const existing: FavoriteRow | null = await ctx
            .runQuery(internal.favorites.findExisting, {
                userId,
                originStationId: args.originStationId,
                destinationStationId: args.destinationStationId,
            })
            .then((row): FavoriteRow | null => {
                if (row === null) {
                    return null;
                }
                return {
                    id: row._id,
                    userId: row.userId,
                    originStationId: row.originStationId,
                    destinationStationId: row.destinationStationId,
                    originStationName: row.originStationName ?? null,
                    destinationStationName: row.destinationStationName ?? null,
                    createdAt: row._creationTime,
                };
            });

        if (existing !== null) {
            throw new ConvexError("Favorite already exists");
        }

        const [originStationName, destinationStationName] = await Promise.all([
            fetchStationName(args.originStationId),
            fetchStationName(args.destinationStationId),
        ]);

        const inserted: FavoriteRow = await ctx.runMutation(internal.favorites.insert, {
            userId,
            originStationId: args.originStationId,
            destinationStationId: args.destinationStationId,
            originStationName: originStationName ?? undefined,
            destinationStationName: destinationStationName ?? undefined,
        });

        return inserted;
    },
});

export const removeFavorite = mutation({
    args: { favoriteId: v.id("favoriteConnections") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        const favorite = await ctx.db.get(args.favoriteId);

        if (favorite === null) {
            throw new ConvexError("Favorite not found");
        }

        if (favorite.userId !== userId) {
            throw new ConvexError("Forbidden");
        }

        await ctx.db.delete(args.favoriteId);

        return null;
    },
});
