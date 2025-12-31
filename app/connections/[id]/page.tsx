"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Connection } from "@/packages/types/lib/types";
import { useSession } from "@apis/hooks/useSession";
import { LoadingSpinner } from "@ui/atoms/loading-spinner";
import { TrainDetailsScreen } from "@ui/organisms/train-details-screen";
import styles from "./page.module.scss";

/**
 * Connection detail page - view a specific connection
 */
export default function ConnectionPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useSession();
    const [connection, setConnection] = useState<Connection | null>(null);
    const [loading, setLoading] = useState(true);
    const [userConnectionId, setUserConnectionId] = useState<string | null>(null);

    const connectionId = params.id as string;

    // Redirect to sign in if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth/signin");
        }
    }, [user, authLoading, router]);

    // Load connection details
    const loadConnection = useCallback(async () => {
        if (!connectionId) return;

        try {
            setLoading(true);
            // TODO: Replace with actual API call to fetch connection by ID
            // For now, we'll need to implement this endpoint
            const response = await fetch(`/api/connections/${connectionId}`);
            if (response.ok) {
                const data = await response.json();
                setConnection(data.connection);
                setUserConnectionId(data.userConnectionId || null);
            } else {
                console.error("Failed to load connection");
                // Redirect to home if connection not found
                router.push("/");
            }
        } catch (error) {
            console.error("Error loading connection:", error);
            router.push("/");
        } finally {
            setLoading(false);
        }
    }, [connectionId, router]);

    useEffect(() => {
        if (connectionId && user) {
            loadConnection();
        }
    }, [connectionId, user, loadConnection]);

    const handleBack = () => {
        router.push("/");
    };

    const handleJoinConnection = async (connectionIdParam: string) => {
        if (!connection || !user) return;

        try {
            const response = await fetch(`/api/connections/${connectionIdParam}/join`, {
                method: "POST",
            });

            if (response.ok) {
                const data = await response.json();
                setUserConnectionId(data.connectionId);
                // Refresh connection data
                loadConnection();
            } else {
                console.error("Failed to join connection");
            }
        } catch (error) {
            console.error("Error joining connection:", error);
        }
    };

    const handleLeaveConnection = async () => {
        if (!connection || !userConnectionId) return;

        try {
            const response = await fetch(`/api/connections/${connectionId}/leave`, {
                method: "POST",
            });

            if (response.ok) {
                setUserConnectionId(null);
                // Refresh connection data
                loadConnection();
            } else {
                console.error("Failed to leave connection");
            }
        } catch (error) {
            console.error("Error leaving connection:", error);
        }
    };

    if (authLoading || loading) {
        return (
            <div className={styles.container}>
                <LoadingSpinner />
            </div>
        );
    }

    if (!connection) {
        return (
            <div className={styles.container}>
                <p>Connection not found</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <TrainDetailsScreen
                connection={connection}
                onBack={handleBack}
                onConfirmPresence={handleJoinConnection}
                onRemovePresence={handleLeaveConnection}
                isUserOnConnection={userConnectionId === connection.id}
            />
        </div>
    );
}
