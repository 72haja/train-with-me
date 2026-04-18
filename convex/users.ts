import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

type PublicUser = {
    _id: Id<"users">;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
};

const toPublicUser = async (ctx: QueryCtx, user: Doc<"users">): Promise<PublicUser> => {
    const avatarUrl = user.avatarStorageId ? await ctx.storage.getUrl(user.avatarStorageId) : null;

    return {
        _id: user._id,
        email: user.email ?? null,
        fullName: user.fullName ?? user.name ?? null,
        avatarUrl,
    };
};

export const getCurrentUser = query({
    args: {},
    handler: async (ctx): Promise<PublicUser | null> => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            return null;
        }

        const user = await ctx.db.get(userId);

        if (user === null) {
            return null;
        }

        return toPublicUser(ctx, user);
    },
});

export const getById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args): Promise<PublicUser | null> => {
        const viewer = await getAuthUserId(ctx);

        if (viewer === null) {
            throw new ConvexError("Not authenticated");
        }

        const user = await ctx.db.get(args.userId);

        if (user === null) {
            return null;
        }

        return toPublicUser(ctx, user);
    },
});

export const updateProfile = mutation({
    args: {
        fullName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        await ctx.db.patch(userId, {
            fullName: args.fullName,
            name: args.fullName,
        });

        return null;
    },
});

export const generateAvatarUploadUrl = mutation({
    args: {},
    handler: async ctx => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        return await ctx.storage.generateUploadUrl();
    },
});

export const setAvatar = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        const user = await ctx.db.get(userId);

        if (user?.avatarStorageId) {
            await ctx.storage.delete(user.avatarStorageId);
        }

        await ctx.db.patch(userId, { avatarStorageId: args.storageId });

        return null;
    },
});

export const removeAvatar = mutation({
    args: {},
    handler: async ctx => {
        const userId = await getAuthUserId(ctx);

        if (userId === null) {
            throw new ConvexError("Not authenticated");
        }

        const user = await ctx.db.get(userId);

        if (user?.avatarStorageId) {
            await ctx.storage.delete(user.avatarStorageId);
            await ctx.db.patch(userId, { avatarStorageId: undefined });
        }

        return null;
    },
});

export const findByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args): Promise<PublicUser | null> => {
        const viewer = await getAuthUserId(ctx);

        if (viewer === null) {
            throw new ConvexError("Not authenticated");
        }

        const normalized = args.email.trim().toLowerCase();

        const user = await ctx.db
            .query("users")
            .withIndex("email", q => q.eq("email", normalized))
            .unique();

        if (user === null) {
            return null;
        }

        return toPublicUser(ctx, user);
    },
});
