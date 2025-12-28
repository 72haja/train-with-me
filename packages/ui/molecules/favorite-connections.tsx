"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { DbFavoriteConnection } from "@/packages/types/lib/types";
import { findStationById } from "@apis/mockStations";
import styles from "./favorite-connections.module.scss";

interface FavoriteConnectionsProps {
    onSelectFavorite: (originId: string, destinationId: string) => void;
    className?: string;
}

export function FavoriteConnections({
    onSelectFavorite,
    className = "",
}: FavoriteConnectionsProps) {
    const [favorites, setFavorites] = useState<DbFavoriteConnection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const response = await fetch("/api/favorites");
            if (response.ok) {
                const data = await response.json();
                setFavorites(data.favorites || []);
            }
        } catch (error) {
            console.error("Failed to load favorites:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleClick = (favorite: DbFavoriteConnection) => {
        onSelectFavorite(favorite.originStationId, favorite.destinationStationId);
    };

    if (loading) {
        return null;
    }

    if (favorites.length === 0) {
        return null;
    }

    return (
        <div className={`${styles.container} ${className}`}>
            <h3 className={styles.title}>Favoriten</h3>
            <div className={styles.card}>
                <div className={styles.list}>
                    {favorites.map(favorite => {
                        const originStation = findStationById(favorite.originStationId);
                        const destinationStation = findStationById(favorite.destinationStationId);

                        if (!originStation || !destinationStation) {
                            return null;
                        }

                        return (
                            <div key={favorite.id} className={styles.itemWrapper}>
                                <button
                                    type="button"
                                    onClick={() => handleClick(favorite)}
                                    className={styles.item}
                                    aria-label={`Select favorite route from ${originStation.name} to ${destinationStation.name}`}>
                                    <div className={styles.content}>
                                        <span className={styles.route}>
                                            <span className={styles.station}>
                                                {originStation.name}
                                            </span>
                                            <span className={styles.arrow}>→</span>
                                            <span className={styles.station}>
                                                {destinationStation.name}
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
            </div>
        </div>
    );
}
