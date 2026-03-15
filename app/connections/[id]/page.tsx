"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import useSWR from "swr";
import type { Connection } from "@/packages/types/lib/types";
import { postFetcher } from "@/app/lib/fetcher";
import { useSession } from "@apis/hooks/useSession";
import { TrainDetailsScreen } from "@ui/organisms/train-details-screen";
import styles from "./page.module.scss";

async function fetchConnection(
    connectionId: string,
    originId: string,
    destinationId: string,
    departure: string,
): Promise<Connection | null> {
    // 1. Try sessionStorage first (instant, from card click)
    try {
        const stored = sessionStorage.getItem(`connection-${connectionId}`);
        if (stored) return JSON.parse(stored) as Connection;
    } catch {
        // ignore
    }

    // 2. Re-fetch from EFA using search context
    const data = await postFetcher<{ connections: Connection[] }>(
        "/api/connections/search",
        {
            originId,
            destinationId,
            date: departure.split("T")[0],
            time: departure.split("T")[1]?.slice(0, 5),
        },
    );

    const match = (data.connections ?? []).find(c => c.id === connectionId) ?? null;

    // Cache for next time
    if (match) {
        try {
            sessionStorage.setItem(`connection-${connectionId}`, JSON.stringify(match));
        } catch {
            // ignore
        }
    }

    return match;
}

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
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading } = useSession();
    const [userConnectionId, setUserConnectionId] = useState<string | null>(null);

    const connectionId = decodeURIComponent(params.id as string);
    const originId = searchParams.get("origin");
    const destinationId = searchParams.get("destination");
    const departure = searchParams.get("departure");

    const canFetch = !!connectionId && !!originId && !!destinationId && !!departure && !!user;

    const { data: connection, isLoading, mutate } = useSWR(
        canFetch ? ["connection-detail", connectionId] : null,
        () => fetchConnection(connectionId, originId!, destinationId!, departure!),
        { revalidateOnFocus: false },
    );

    const handleBack = () => {
        router.back();
    };

    // Redirect if not authenticated
    if (!authLoading && !user) {
        router.push("/auth/signin");
        return null;
    }

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
                mutate();
            } else {
                console.error("Failed to leave connection");
            }
        } catch (error) {
            console.error("Error leaving connection:", error);
        }
    };

    if (authLoading || isLoading) {
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
        <Suspense fallback={<ConnectionDetailLoadingShell onBack={() => window.history.back()} />}>
            <ConnectionPageContent />
        </Suspense>
    );
}
