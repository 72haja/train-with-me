"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Connection, DbFavoriteConnection } from "@/packages/types/lib/types";
import { useSession } from "@apis/hooks/useSession";
import { searchConnections } from "@apis/mobidata";
import { LoadingSpinner } from "@ui/atoms/loading-spinner";
import { TrainSelectionScreen } from "@ui/organisms/train-selection-screen";
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

    // Load favorites when user is available
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

    // Show loading spinner while checking auth or performing search
    if (authLoading || loading || !user) {
        return (
            <div className={styles.container}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // If search params are missing, redirect will happen
    if (!originId || !destinationId || !date || !time) {
        return null;
    }

    return (
        <div className={styles.container}>
            <TrainSelectionScreen
                connections={connections}
                onSelectConnection={handleSelectConnection}
                onBack={handleBack}
                userConnectionId={userConnectionId}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
            />
        </div>
    );
}
