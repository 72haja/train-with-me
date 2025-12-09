"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { Connection } from "@/types/vvs";
import { useAuth } from "@apis/hooks/useAuth";
import { searchConnections } from "@apis/mockConnections";
import { mockConnections } from "@apis/mockData";
import { LoadingSpinner } from "@ui/atoms/loading-spinner";
import { HomeScreen } from "@ui/organisms/home-screen";
import { TrainDetailsScreen } from "@ui/organisms/train-details-screen";
import { TrainSelectionScreen } from "@ui/organisms/train-selection-screen";

type Screen = "home" | "selection" | "details";

export default function App() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [currentScreen, setCurrentScreen] = useState<Screen>("home");
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [userConnectionId, setUserConnectionId] = useState<string | null>(null);
    const [connections, setConnections] = useState<Connection[]>(mockConnections);
    const [searchLoading, setSearchLoading] = useState(false);

    // Redirect to sign in if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth/signin");
        }
    }, [user, authLoading, router]);

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
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
