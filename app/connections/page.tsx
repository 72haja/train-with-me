"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Connection, DbFavoriteConnection } from "@/packages/types/lib/types";
import { useSession } from "@apis/hooks/useSession";
import { searchConnections } from "@apis/mobidata";
import { LoadingSpinner } from "@ui/atoms/loading-spinner";
import { ConnectionCard } from "@ui/molecules/connection-card";
import styles from "./page.module.scss";

/**
 * Connections search results page
 * Reads search params and displays connection results
 */
export default function ConnectionsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useSession();

    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<DbFavoriteConnection[]>([]);
    const [userConnectionId] = useState<string | null>(null);

    // Get search params
    const originId = searchParams.get("origin");
    const destinationId = searchParams.get("destination");
    const date = searchParams.get("date");
    const time = searchParams.get("time");

    // Redirect to sign in if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth/signin");
        }
    }, [user, authLoading, router]);

    // Redirect to home if search params are missing
    useEffect(() => {
        if (!authLoading && user && (!originId || !destinationId)) {
            router.push("/");
        }
    }, [authLoading, user, originId, destinationId, router]);

    // Load favorites when user is available (non-blocking)
    useEffect(() => {
        if (user) {
            loadFavorites();
        }
    }, [user]);

    // Perform search when params are available
    useEffect(() => {
        const performSearch = async () => {
            if (!originId || !destinationId || !date || !time) return;

            setLoading(true);
            try {
                // Combine date and time into ISO 8601 format
                const departureTime = new Date(`${date}T${time}`).toISOString();
                const results = await searchConnections(originId, destinationId, departureTime);
                setConnections(results);
            } catch (error) {
                console.error("Failed to search connections:", error);
                setConnections([]);
            } finally {
                setLoading(false);
            }
        };
        if (user && originId && destinationId && date && time) {
            performSearch();
        }
    }, [user, originId, destinationId, date, time]);

    const loadFavorites = async () => {
        try {
            const response = await fetch("/api/favorites");
            if (response.ok) {
                const data = await response.json();
                setFavorites(data.favorites || []);
            }
        } catch (error) {
            console.error("Failed to load favorites:", error);
        }
    };

    const handleToggleFavorite = async (
        originId: string,
        destinationId: string,
        isCurrentlyFavorite: boolean
    ) => {
        try {
            if (isCurrentlyFavorite) {
                // Remove favorite
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
                        setFavorites(prev => prev.filter(fav => fav.id !== favorite.id));
                    }
                }
            } else {
                // Add favorite
                const response = await fetch("/api/favorites", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        originStationId: originId,
                        destinationStationId: destinationId,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setFavorites(prev => [...prev, data.favorite]);
                } else if (response.status === 409) {
                    // Favorite already exists, reload favorites to get the current state
                    await loadFavorites();
                }
            }
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
        }
    };

    const isFavorite = (originId: string, destinationId: string) => {
        return favorites.some(
            fav => fav.originStationId === originId && fav.destinationStationId === destinationId
        );
    };

    const handleSelectConnection = (connection: Connection) => {
        // Navigate to the connection detail page
        router.push(`/connections/${connection.id}`);
    };

    const handleBack = () => {
        router.push("/");
    };

    // Show loading spinner only while checking auth
    if (authLoading || !user) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // If search params are missing, redirect will happen
    if (!originId || !destinationId || !date || !time) {
        return null;
    }

    // Show header immediately, then progressive render connections
    return (
        <div className={styles.container}>
            {/* Header - shown immediately */}
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
                </div>
            </header>

            {/* Main content - progressive rendering */}
            <main className={styles.main}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <LoadingSpinner size="lg" />
                        <p className={styles.loadingText}>Searching connections...</p>
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
                                isActive={userConnectionId === connection.id}
                                onToggleFavorite={handleToggleFavorite}
                                isFavorite={
                                    isFavorite
                                        ? isFavorite(
                                              connection.departure.station.id,
                                              connection.arrival.station.id
                                          )
                                        : false
                                }
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
