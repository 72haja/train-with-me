"use client";

import { Suspense } from "react";
import { clsx } from "clsx";
import { FavoriteConnectionsContent } from "./favorite-connections-content";
import { FavoriteConnectionsSkeleton } from "./favorite-connections-skeleton";
import styles from "./favorite-connections.module.scss";

interface FavoriteConnectionsProps {
    onSelectFavorite: (
        originId: string,
        destinationId: string,
        originName?: string,
        destinationName?: string
    ) => void;
    className?: string;
}

/**
 * Static shell (title + card) is SSR-able. The list is wrapped in Suspense
 * and shows a skeleton while favorites are loading.
 */
export function FavoriteConnections({
    onSelectFavorite,
    className = "",
}: FavoriteConnectionsProps) {
    return (
        <div className={clsx(styles.container, className)}>
            <h3 className={styles.title}>Favoriten</h3>
            <div className={styles.card}>
                <Suspense fallback={<FavoriteConnectionsSkeleton />}>
                    <FavoriteConnectionsContent onSelectFavorite={onSelectFavorite} />
                </Suspense>
            </div>
        </div>
    );
}
