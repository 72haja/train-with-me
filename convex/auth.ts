import type { GenericMutationCtx } from "convex/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";

type AppMutationCtx = GenericMutationCtx<DataModel>;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
    providers: [
        Password({
            profile(params) {
                const email = (params.email as string).toLowerCase();
                const fullNameRaw = params.fullName;
                const fullName =
                    typeof fullNameRaw === "string" && fullNameRaw.length > 0
                        ? fullNameRaw
                        : undefined;

                return {
                    email,
                    ...(fullName !== undefined ? { fullName } : {}),
                };
            },
        }),
    ],
    callbacks: {
        // Merge sign-ups with migrated user records by email so friendships and
        // joined connections stay linked after the Supabase -> Convex migration.
        async createOrUpdateUser(rawCtx, args) {
            const ctx = rawCtx as unknown as AppMutationCtx;

            if (args.existingUserId !== null) {
                return args.existingUserId;
            }

            const email =
                typeof args.profile.email === "string"
                    ? args.profile.email.toLowerCase()
                    : undefined;

            if (email !== undefined) {
                const existing = await ctx.db
                    .query("users")
                    .withIndex("email", q => q.eq("email", email))
                    .unique();

                if (existing !== null) {
                    const patch: {
                        email: string;
                        fullName?: string;
                        name?: string;
                    } = { email };
                    const incoming = args.profile as {
                        fullName?: unknown;
                        name?: unknown;
                    };
                    if (typeof incoming.fullName === "string" && existing.fullName === undefined) {
                        patch.fullName = incoming.fullName;
                        patch.name = incoming.fullName;
                    }
                    await ctx.db.patch(existing._id, patch);
                    return existing._id;
                }
            }

            return await ctx.db.insert("users", {
                ...(args.profile as { email?: string }),
            });
        },
    },
});
