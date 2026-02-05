"use client";

import { clsx } from "clsx";
import { Trash2 } from "lucide-react";
import useSWR from "swr";
import type { DbFavoriteConnection } from "@/packages/types/lib/types";
import { EmptyTrainIcon } from "@ui/atoms/empty-train-icon";
import styles from "./favorite-connections.module.scss";

type FavoriteWithNames = DbFavoriteConnection & {
    originStationName?: string | null;
    destinationStationName?: string | null;
};

const FAVORITES_KEY = "/api/favorites";

async function fetchFavorites(): Promise<FavoriteWithNames[]> {
    const response = await fetch(FAVORITES_KEY);
    if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error(`Failed to load favorites: ${response.status}`);
    }
    const data = await response.json();
    return (data.favorites ?? []) as FavoriteWithNames[];
}

interface FavoriteConnectionsContentProps {
    onSelectFavorite: (originId: string, destinationId: string) => void;
    className?: string;
}

/**
 * Fetches favorites with SWR and renders the list. Suspends until the request resolves.
 * Wrap in <Suspense> with a skeleton fallback.
 */
export function FavoriteConnectionsContent({
    onSelectFavorite,
    className = "",
}: FavoriteConnectionsContentProps) {
    const { data: favorites = [], mutate } = useSWR(FAVORITES_KEY, fetchFavorites, {
        suspense: true,
    });

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(`/api/favorites/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                await mutate(
                    favorites.filter(fav => fav.id !== id),
                    { revalidate: false }
                );
            }
        } catch (error) {
            console.error("Failed to delete favorite:", error);
        }
    };

    const handleClick = (favorite: FavoriteWithNames) => {
        onSelectFavorite(favorite.originStationId, favorite.destinationStationId);
    };

    if (favorites.length === 0) {
        return (
            <div className={clsx(styles.emptyState, className)}>
                <EmptyTrainIcon />
                <p className={styles.emptyText}>Noch keine Favoriten</p>
                <p className={styles.emptySubtext}>
                    Füge Verbindungen zu deinen Favoriten hinzu, um sie schnell
                    wiederzufinden
                </p>
            </div>
        );
    }

    return (
        <div className={clsx(styles.list, className)}>
            {favorites.map(favorite => {
                    const originName =
                        favorite.originStationName || favorite.originStationId;
                    const destinationName =
                        favorite.destinationStationName ||
                        favorite.destinationStationId;
                    return (
                        <div key={favorite.id} className={styles.itemWrapper}>
                            <button
                                type="button"
                                onClick={() => handleClick(favorite)}
                                className={styles.item}
                                aria-label={`Select favorite route from ${originName} to ${destinationName}`}>
                                <div className={styles.content}>
                                    <span className={styles.route}>
                                        <span className={styles.station}>
                                            {originName}
                                        </span>
                                        <span className={styles.arrow}>→</span>
                                        <span className={styles.station}>
                                            {destinationName}
                                        </span>
                                    </span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={e => handleDelete(favorite.id, e)}
                                className={styles.deleteButton}
                                aria-label="Remove favorite">
                                <Trash2 className={styles.deleteIcon} />
                            </button>
                        </div>
                    );
                })}
        </div>
    );
}
