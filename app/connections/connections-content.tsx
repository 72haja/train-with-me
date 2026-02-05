"use client";

import { ArrowLeft } from "lucide-react";
import { useConnectionsPage } from "@/app/connections/hooks/useConnectionsPage";
import type { Connection, DbFavoriteConnection } from "@/packages/types/lib/types";
import { FavoriteButton } from "@ui/atoms/favorite-button";
import { ConnectionCard } from "@ui/molecules/connection-card";
import styles from "./page.module.scss";

export type ConnectionsSearchParams = {
    originId: string;
    destinationId: string;
    date: string | null;
    time: string | null;
};

export function ConnectionsContent({
    initialConnections,
    initialFavorites,
    searchParams,
}: {
    initialConnections: Connection[];
    initialFavorites: DbFavoriteConnection[];
    searchParams: ConnectionsSearchParams;
}) {
    const {
        date,
        time,
        connections,
        isLoading,
        errorMessage,
        isRouteFavorite,
        favoriteLoading,
        handleHeaderToggleFavorite,
        joinedConnectionIds,
        handleSelectConnection,
        handleBack,
    } = useConnectionsPage({
        searchParams,
        initialConnections,
        initialFavorites,
    });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <button onClick={handleBack} className={styles.backButton} aria-label="Go back">
                        <ArrowLeft className={styles.backButtonIcon} />
                    </button>
                    <div className={styles.headerInfo}>
                        <h1 className={styles.headerTitle}>Available trains</h1>
                        <p className={styles.headerSubtitle}>
                            {date && time ? `${date} · ${time}` : "Loading..."}
                        </p>
                    </div>
                    <FavoriteButton
                        isFavorite={isRouteFavorite}
                        isLoading={favoriteLoading}
                        onClick={handleHeaderToggleFavorite}
                        className={styles.headerFavoriteButton}
                        iconSize="md"
                    />
                </div>
            </header>

            <main className={styles.main}>
                {isLoading ? (
                    <div
                        className={styles.skeletonList}
                        aria-busy="true"
                        aria-label="Loading connections">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={styles.skeletonBadge} />
                                <div className={styles.skeletonContent}>
                                    <div
                                        className={`${styles.skeletonLine} ${styles.skeletonLineLong}`}
                                    />
                                    <div
                                        className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : errorMessage ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyText}>Error searching connections</p>
                        <p className={styles.emptySubtext}>{errorMessage}</p>
                    </div>
                ) : connections.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyText}>No connections found</p>
                        <p className={styles.emptySubtext}>Try adjusting your search parameters</p>
                    </div>
                ) : (
                    <div className={styles.connections}>
                        {connections.map(connection => (
                            <ConnectionCard
                                key={connection.id}
                                connection={connection}
                                onClick={() => handleSelectConnection(connection)}
                                isActive={joinedConnectionIds?.includes(connection.id) ?? false}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
