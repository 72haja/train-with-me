"use client";

import { useCallback, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { DbFavoriteConnection } from "@/packages/types/lib/types";

const normalize = (
    favorites:
        | Array<{
              id: Id<"favoriteConnections">;
              userId: Id<"users">;
              originStationId: string;
              destinationStationId: string;
              originStationName: string | null;
              destinationStationName: string | null;
              createdAt: number;
          }>
        | undefined,
    fallback: DbFavoriteConnection[]
): DbFavoriteConnection[] => {
    if (favorites === undefined) {
        return fallback;
    }

    return favorites.map(fav => ({
        id: fav.id,
        userId: fav.userId,
        originStationId: fav.originStationId,
        destinationStationId: fav.destinationStationId,
        originStationName: fav.originStationName,
        destinationStationName: fav.destinationStationName,
        createdAt: new Date(fav.createdAt).toISOString(),
    }));
};

export const useFavorites = (initialFavorites: DbFavoriteConnection[]) => {
    const data = useQuery(api.favorites.list, {});
    const favorites = normalize(data, initialFavorites);
    const addFavorite = useAction(api.favorites.add);
    const removeFavorite = useMutation(api.favorites.removeFavorite);

    const toggleFavorite = useCallback(
        async (originId: string, destinationId: string, isCurrentlyFavorite: boolean) => {
            try {
                if (isCurrentlyFavorite) {
                    const favorite = favorites.find(
                        fav =>
                            fav.originStationId === originId &&
                            fav.destinationStationId === destinationId
                    );
                    if (favorite) {
                        await removeFavorite({
                            favoriteId: favorite.id as Id<"favoriteConnections">,
                        });
                    }
                } else {
                    await addFavorite({
                        originStationId: originId,
                        destinationStationId: destinationId,
                    });
                }
            } catch (err) {
                console.error("Failed to toggle favorite:", err);
            }
        },
        [favorites, addFavorite, removeFavorite]
    );

    const isFavorite = useCallback(
        (originId: string, destinationId: string) =>
            favorites.some(
                fav =>
                    fav.originStationId === originId && fav.destinationStationId === destinationId
            ),
        [favorites]
    );

    return { favorites, toggleFavorite, isFavorite };
};

export const useRouteFavoriteToggle = (
    originId: string,
    destinationId: string,
    options: {
        isFavorite: (o: string, d: string) => boolean;
        toggleFavorite: (o: string, d: string, isCurrentlyFavorite: boolean) => Promise<void>;
    }
) => {
    const [loading, setLoading] = useState(false);
    const isRouteFavorite = options.isFavorite(originId, destinationId);

    const handleToggle = useCallback(async () => {
        setLoading(true);
        try {
            await options.toggleFavorite(originId, destinationId, isRouteFavorite);
        } finally {
            setLoading(false);
        }
    }, [originId, destinationId, isRouteFavorite, options]);

    return { isRouteFavorite, loading, handleToggle };
};
