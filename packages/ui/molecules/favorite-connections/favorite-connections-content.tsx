"use client";

import { clsx } from "clsx";
import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyTrainIcon } from "@ui/atoms/empty-train-icon";
import styles from "./favorite-connections.module.scss";

type FavoriteWithNames = {
    id: Id<"favoriteConnections">;
    originStationId: string;
    destinationStationId: string;
    originStationName: string | null;
    destinationStationName: string | null;
};

interface FavoriteConnectionsContentProps {
    onSelectFavorite: (
        originId: string,
        destinationId: string,
        originName?: string,
        destinationName?: string
    ) => void;
    className?: string;
}

export const FavoriteConnectionsContent = ({
    onSelectFavorite,
    className = "",
}: FavoriteConnectionsContentProps) => {
    const data = useQuery(api.favorites.list, {});
    const removeFavorite = useMutation(api.favorites.removeFavorite);

    const favorites: FavoriteWithNames[] = (data ?? []).map(fav => ({
        id: fav.id,
        originStationId: fav.originStationId,
        destinationStationId: fav.destinationStationId,
        originStationName: fav.originStationName,
        destinationStationName: fav.destinationStationName,
    }));

    const handleDelete = async (
        id: Id<"favoriteConnections">,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        try {
            await removeFavorite({ favoriteId: id });
        } catch (error) {
            console.error("Failed to delete favorite:", error);
        }
    };

    const handleClick = (favorite: FavoriteWithNames) => {
        onSelectFavorite(
            favorite.originStationId,
            favorite.destinationStationId,
            favorite.originStationName ?? undefined,
            favorite.destinationStationName ?? undefined
        );
    };

    if (favorites.length === 0) {
        return (
            <div className={clsx(styles.emptyState, className)}>
                <EmptyTrainIcon />
                <p className={styles.emptyText}>Noch keine Favoriten</p>
                <p className={styles.emptySubtext}>
                    Füge Verbindungen zu deinen Favoriten hinzu, um sie schnell wiederzufinden
                </p>
            </div>
        );
    }

    return (
        <div className={clsx(styles.list, className)}>
            {favorites.map(favorite => {
                const originName = favorite.originStationName || favorite.originStationId;
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
                                    <span className={styles.station}>{destinationName}</span>
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
};
