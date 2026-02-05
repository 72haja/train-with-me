import { useState, useCallback } from "react";
import useSWR from "swr";
import type { DbFavoriteConnection } from "@/packages/types/lib/types";

async function fetchFavorites(): Promise<DbFavoriteConnection[]> {
    const res = await fetch("/api/favorites");
    if (!res.ok) return [];
    const data = await res.json();
    return data.favorites ?? [];
}

export function useFavorites(initialFavorites: DbFavoriteConnection[]) {
    const { data: favorites = initialFavorites, mutate: mutateFavorites } = useSWR(
        "/api/favorites",
        fetchFavorites,
        { fallbackData: initialFavorites, revalidateOnMount: false }
    );

    const toggleFavorite = useCallback(
        async (
            originId: string,
            destinationId: string,
            isCurrentlyFavorite: boolean
        ) => {
            try {
                if (isCurrentlyFavorite) {
                    const favorite = favorites.find(
                        fav =>
                            fav.originStationId === originId &&
                            fav.destinationStationId === destinationId
                    );
                    if (favorite) {
                        const response = await fetch(`/api/favorites/${favorite.id}`, {
                            method: "DELETE",
                        });
                        if (response.ok) {
                            await mutateFavorites(
                                prev => prev?.filter(fav => fav.id !== favorite.id) ?? [],
                                { revalidate: false }
                            );
                        }
                    }
                } else {
                    const response = await fetch("/api/favorites", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            originStationId: originId,
                            destinationStationId: destinationId,
                        }),
                    });
                    if (response.ok) {
                        const data = await response.json();
                        await mutateFavorites(
                            prev => [...(prev ?? []), data.favorite],
                            { revalidate: false }
                        );
                    } else if (response.status === 409) {
                        await mutateFavorites();
                    }
                }
            } catch (err) {
                console.error("Failed to toggle favorite:", err);
            }
        },
        [favorites, mutateFavorites]
    );

    const isFavorite = useCallback(
        (originId: string, destinationId: string) =>
            favorites.some(
                fav =>
                    fav.originStationId === originId &&
                    fav.destinationStationId === destinationId
            ),
        [favorites]
    );

    return { favorites, toggleFavorite, isFavorite };
}

export function useRouteFavoriteToggle(
    originId: string,
    destinationId: string,
    options: {
        isFavorite: (o: string, d: string) => boolean;
        toggleFavorite: (
            o: string,
            d: string,
            isCurrentlyFavorite: boolean
        ) => Promise<void>;
    }
) {
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
}
