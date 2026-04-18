"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type SessionUser = {
    id: Id<"users">;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
};

type UseSessionResult = {
    user: SessionUser | null;
    loading: boolean;
    isAuthenticated: boolean;
};

export const useSession = (): UseSessionResult => {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");

    if (isLoading) {
        return { user: null, loading: true, isAuthenticated: false };
    }

    if (!isAuthenticated) {
        return { user: null, loading: false, isAuthenticated: false };
    }

    if (currentUser === undefined) {
        return { user: null, loading: true, isAuthenticated: true };
    }

    if (currentUser === null) {
        return { user: null, loading: false, isAuthenticated: true };
    }

    return {
        user: {
            id: currentUser._id,
            email: currentUser.email,
            fullName: currentUser.fullName,
            avatarUrl: currentUser.avatarUrl,
        },
        loading: false,
        isAuthenticated: true,
    };
};
