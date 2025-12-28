"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { Connection, DbFavoriteConnection } from "@/packages/types/lib/types";
import { useSession } from "@apis/hooks/useSession";
import { searchConnections } from "@apis/mockConnections";
import { mockConnections } from "@apis/mockData";
import { LoadingSpinner } from "@ui/atoms/loading-spinner";
import { HomeScreen } from "@ui/organisms/home-screen";
import { TrainDetailsScreen } from "@ui/organisms/train-details-screen";
import { TrainSelectionScreen } from "@ui/organisms/train-selection-screen";

type Screen = "home" | "selection" | "details";

export default function App() {
    const router = useRouter();
    const { user, loading: authLoading } = useSession();
    const [currentScreen, setCurrentScreen] = useState<Screen>("home");
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [userConnectionId, setUserConnectionId] = useState<string | null>(null);
    const [connections, setConnections] = useState<Connection[]>(mockConnections);
    const [searchLoading, setSearchLoading] = useState(false);
    const [favorites, setFavorites] = useState<DbFavoriteConnection[]>([]);

    // Redirect to sign in if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth/signin");
        }
    }, [user, authLoading, router]);

    // Load favorites when user is available
    useEffect(() => {
        if (user) {
            loadFavorites();
        }
    }, [user]);

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

    const getFavorite = (originId: string, destinationId: string) => {
        return favorites.find(
            fav => fav.originStationId === originId && fav.destinationStationId === destinationId
        );
    };

    const isFavorite = (originId: string, destinationId: string) => {
        return getFavorite(originId, destinationId) !== undefined;
    };

    const handleSelectConnection = (connection: Connection) => {
        setSelectedConnection(connection);
        setCurrentScreen("details");
    };

    const handleConfirmPresence = async (connectionId: string) => {
        if (!user) return;

        try {
            const response = await fetch(`/api/connections/${connectionId}/join`, {
                method: "POST",
            });

            if (response.ok) {
                setUserConnectionId(connectionId);
            }
        } catch (error) {
            console.error("Failed to join connection:", error);
        }
    };

    const handleRemovePresence = async () => {
        if (!user || !userConnectionId) return;

        try {
            const response = await fetch(`/api/connections/${userConnectionId}/leave`, {
                method: "DELETE",
            });

            if (response.ok) {
                setUserConnectionId(null);
            }
        } catch (error) {
            console.error("Failed to leave connection:", error);
        }
    };

    const handleBack = () => {
        if (currentScreen === "details") {
            setCurrentScreen("selection");
        } else if (currentScreen === "selection") {
            setCurrentScreen("home");
        }
    };

    const handleSearchRoute = (originId: string, destinationId: string) => {
        setSearchLoading(true);

        // Reload favorites when searching to ensure they're up to date
        if (user) {
            loadFavorites();
        }

        // Simulate API call delay
        setTimeout(() => {
            const results = searchConnections(originId, destinationId);
            setConnections(results);
            setSearchLoading(false);
            setCurrentScreen("selection");
        }, 500);
    };

    // Show loading spinner while checking auth
    if (authLoading || !user) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <main>
            <AnimatePresence mode="wait">
                {currentScreen === "home" && (
                    <motion.div
                        key="home"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}>
                        <HomeScreen
                            onNavigateToSelection={() => setCurrentScreen("selection")}
                            onSearchRoute={handleSearchRoute}
                            searchLoading={searchLoading}
                        />
                    </motion.div>
                )}

                {currentScreen === "selection" && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}>
                        <TrainSelectionScreen
                            connections={connections}
                            onSelectConnection={handleSelectConnection}
                            onBack={handleBack}
                            userConnectionId={userConnectionId}
                            onToggleFavorite={handleToggleFavorite}
                            isFavorite={isFavorite}
                        />
                    </motion.div>
                )}

                {currentScreen === "details" && selectedConnection && (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}>
                        <TrainDetailsScreen
                            connection={selectedConnection}
                            onBack={handleBack}
                            onConfirmPresence={handleConfirmPresence}
                            onRemovePresence={handleRemovePresence}
                            isUserOnConnection={userConnectionId === selectedConnection.id}
                            onToggleFavorite={handleToggleFavorite}
                            isFavorite={
                                selectedConnection
                                    ? isFavorite(
                                          selectedConnection.departure.station.id,
                                          selectedConnection.arrival.station.id
                                      )
                                    : false
                            }
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
