"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Trash2 } from "lucide-react";
import type { DbFavoriteConnection } from "@/packages/types/lib/types";
import { EmptyTrainIcon } from "@ui/atoms/empty-train-icon";
import styles from "./favorite-connections.module.scss";

// Extended type to include station names from API response
type FavoriteWithNames = DbFavoriteConnection & {
    originStationName?: string | null;
    destinationStationName?: string | null;
};

interface FavoriteConnectionsProps {
    onSelectFavorite: (originId: string, destinationId: string) => void;
    className?: string;
}

export function FavoriteConnections({
    onSelectFavorite,
    className = "",
}: FavoriteConnectionsProps) {
    const [favorites, setFavorites] = useState<FavoriteWithNames[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadFavorites() {
            try {
                const response = await fetch("/api/favorites");
                if (response.ok) {
                    const data = await response.json();
                    setFavorites(data.favorites || []);
                } else {
                    console.error(
                        "Failed to load favorites:",
                        response.status,
                        response.statusText
                    );
                    setFavorites([]);
                }
            } catch (error) {
                console.error("Failed to load favorites:", error);
                setFavorites([]);
            } finally {
                setLoading(false);
            }
        }
        loadFavorites();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(`/api/favorites/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                setFavorites(prev => prev.filter(fav => fav.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete favorite:", error);
        }
    };

    const handleClick = (favorite: FavoriteWithNames) => {
        onSelectFavorite(favorite.originStationId, favorite.destinationStationId);
    };

    if (loading) {
        return null;
    }

    return (
        <div className={clsx(styles.container, className)}>
            <h3 className={styles.title}>Favoriten</h3>
            <div className={styles.card}>
                {favorites.length === 0 ? (
                    <div className={styles.emptyState}>
                        <EmptyTrainIcon />
                        <p className={styles.emptyText}>Noch keine Favoriten</p>
                        <p className={styles.emptySubtext}>
                            Füge Verbindungen zu deinen Favoriten hinzu, um sie schnell
                            wiederzufinden
                        </p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {favorites.map(favorite => {
                            // Use station names from favorite data, fallback to IDs if not available
                            const originName =
                                favorite.originStationName || favorite.originStationId;
                            const destinationName =
                                favorite.destinationStationName || favorite.destinationStationId;
                            return (
                                <div key={favorite.id} className={styles.itemWrapper}>
                                    <button
                                        type="button"
                                        onClick={() => handleClick(favorite)}
                                        className={styles.item}
                                        aria-label={`Select favorite route from ${originName} to ${destinationName}`}>
                                        <div className={styles.content}>
                                            <span className={styles.route}>
                                                <span className={styles.station}>{originName}</span>
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
                )}
            </div>
        </div>
    );
}
