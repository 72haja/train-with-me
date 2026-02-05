"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Connection } from "@/packages/types/lib/types";
import { useSession } from "@apis/hooks/useSession";
import { TrainDetailsScreen } from "@ui/organisms/train-details-screen";
import styles from "./page.module.scss";

function ConnectionDetailLoadingShell({ onBack }: { onBack: () => void }) {
    return (
        <div className={styles.container}>
            <header className={styles.loadingHeader}>
                <div className={styles.loadingHeaderContent}>
                    <button
                        type="button"
                        onClick={onBack}
                        className={styles.loadingBackButton}
                        aria-label="Go back">
                        <ArrowLeft className={styles.loadingBackIcon} />
                    </button>
                    <div className={styles.loadingHeaderInfo}>
                        <div className={styles.loadingBadge} aria-hidden />
                        <div className={styles.loadingHeaderText}>
                            <p className={styles.loadingTitle}>Loading connection…</p>
                            <p className={styles.loadingSubtitle}>--:--</p>
                        </div>
                    </div>
                </div>
            </header>
            <main className={styles.loadingMain} aria-busy="true">
                <div className={styles.loadingCard}>
                    <div className={`${styles.loadingCardLine} ${styles.long}`} />
                    <div className={`${styles.loadingCardLine} ${styles.short}`} />
                    <div className={`${styles.loadingCardLine} ${styles.long}`} />
                </div>
                <div className={styles.loadingButton} />
                <div className={styles.loadingFriendsCard}>
                    <div className={styles.loadingFriendsLine} />
                </div>
            </main>
        </div>
    );
}

/**
 * Inner content: uses useParams (uncached). Must be inside Suspense so the route can prerender.
 */
function ConnectionPageContent() {
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

    // Load connection details (static IDs from static-vvs API, others from connections API)
    const loadConnection = useCallback(async () => {
        if (!connectionId) return;

        const url =
            connectionId.startsWith("static-")
                ? `/api/static-vvs/connections/${connectionId}`
                : `/api/connections/${connectionId}`;

        try {
            setLoading(true);
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setConnection(data.connection);
                let userOnConnection = data.userConnectionId ?? null;
                if (!userOnConnection) {
                    const meRes = await fetch("/api/connections/me");
                    if (meRes.ok) {
                        const me = await meRes.json();
                        userOnConnection = me.connectionIds?.includes(connectionId)
                            ? connectionId
                            : null;
                    }
                }
                setUserConnectionId(userOnConnection);
            } else {
                console.error("Failed to load connection");
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
        router.back();
    };

    const handleJoinConnection = async (connectionIdParam: string) => {
        if (!connection || !user) return;

        try {
            const response = await fetch(`/api/connections/${connectionIdParam}/join`, {
                method: "POST",
            });

            if (response.ok) {
                const data = await response.json();
                setUserConnectionId(data.connectionId ?? connectionIdParam);
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
                loadConnection();
            } else {
                console.error("Failed to leave connection");
            }
        } catch (error) {
            console.error("Error leaving connection:", error);
        }
    };

    if (authLoading || loading) {
        return <ConnectionDetailLoadingShell onBack={handleBack} />;
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

/**
 * Connection detail page - view a specific connection.
 * Wrapped in Suspense so useParams (uncached data) does not block the route during prerender.
 */
export default function ConnectionPage() {
    return (
        <Suspense
            fallback={
                <ConnectionDetailLoadingShell onBack={() => window.history.back()} />
            }>
            <ConnectionPageContent />
        </Suspense>
    );
}
