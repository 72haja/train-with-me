"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import useSWR from "swr";
import { useMyConnections } from "@/app/hooks/useMyConnections";
import { fetcher, postFetcher } from "@/app/lib/fetcher";
import type { Connection, FriendOnConnection } from "@/packages/types/lib/types";
import { useSession } from "@apis/hooks/useSession";
import { TrainDetailsScreen } from "@ui/organisms/train-details-screen";
import styles from "./page.module.scss";

async function fetchConnection(
    connectionId: string,
    originId: string,
    destinationId: string,
    departure: string
): Promise<Connection | null> {
    // 1. Try sessionStorage first (instant, from card click)
    try {
        const stored = sessionStorage.getItem(`connection-${connectionId}`);
        if (stored) return JSON.parse(stored) as Connection;
    } catch {
        // ignore
    }

    // 2. Re-fetch from EFA using search context
    const data = await postFetcher<{ connections: Connection[] }>("/api/connections/search", {
        originId,
        destinationId,
        date: departure.split("T")[0],
        time: departure.split("T")[1]?.slice(0, 5),
    });

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
    const { connectionIds, mutate: mutateMyConnections } = useMyConnections();
    const [optimisticJoined, setOptimisticJoined] = useState<boolean | null>(null);

    const connectionId = params.id as string;
    const originId = searchParams.get("origin");
    const destinationId = searchParams.get("destination");
    const departure = searchParams.get("departure");

    const canFetch = !!connectionId && !!originId && !!destinationId && !!departure && !!user;

    const {
        data: connection,
        isLoading,
        mutate,
    } = useSWR(
        canFetch ? ["connection-detail", connectionId, user?.id] : null,
        () => fetchConnection(connectionId, originId!, destinationId!, departure!),
        { revalidateOnFocus: false }
    );

    // Fetch friends on this trip from Supabase (tripId-based matching for partial route overlap)
    const tripId = connection?.tripId;
    const friendsUrl = tripId
        ? `/api/connections/${connectionId}/friends?tripId=${encodeURIComponent(tripId)}`
        : `/api/connections/${connectionId}/friends`;

    const { data: friendsData, mutate: mutateFriends } = useSWR(
        user && connectionId ? [friendsUrl, user.id] : null,
        () => fetcher<{ friends: FriendOnConnection[] }>(friendsUrl)
    );

    // Merge Supabase friends into the connection object
    const connectionWithFriends = connection
        ? {
              ...connection,
              friends: (friendsData?.friends ?? []).map(f => ({
                  id: f.id,
                  name: f.name,
                  avatarUrl: f.avatarUrl ?? undefined,
                  isOnline: false,
                  originStationName: f.originStationName,
                  destinationStationName: f.destinationStationName,
                  departureTime: f.departureTime,
                  arrivalTime: f.arrivalTime,
              })),
          }
        : null;

    // Server-backed presence check, with optimistic override for join/leave
    const isUserOnConnection =
        optimisticJoined !== null ? optimisticJoined : connectionIds.includes(connectionId);

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
            setOptimisticJoined(true);
            const response = await fetch(`/api/connections/${connectionIdParam}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    originStationId: originId,
                    originStationName: connection.departure.station.name,
                    destinationStationId: destinationId,
                    destinationStationName: connection.arrival.station.name,
                    departureTime: connection.departure.scheduledDeparture,
                    arrivalTime: connection.arrival.scheduledDeparture,
                    lineNumber: connection.line.number,
                    lineType: connection.line.type,
                    lineColor: connection.line.color,
                    lineDirection: connection.line.direction,
                    tripId: connection.tripId,
                }),
            });

            if (response.ok) {
                mutateMyConnections();
                mutateFriends();
            } else {
                setOptimisticJoined(null);
                console.error("Failed to join connection");
            }
        } catch (error) {
            setOptimisticJoined(null);
            console.error("Error joining connection:", error);
        }
    };

    const handleLeaveConnection = async () => {
        if (!connection) return;

        try {
            setOptimisticJoined(false);
            const response = await fetch(`/api/connections/${connectionId}/leave`, {
                method: "POST",
            });

            if (response.ok) {
                mutateMyConnections();
                mutateFriends();
                mutate();
            } else {
                setOptimisticJoined(null);
                console.error("Failed to leave connection");
            }
        } catch (error) {
            setOptimisticJoined(null);
            console.error("Error leaving connection:", error);
        }
    };

    if (authLoading || isLoading) {
        return <ConnectionDetailLoadingShell onBack={handleBack} />;
    }

    if (!connectionWithFriends) {
        return (
            <div className={styles.container}>
                <p>Connection not found</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <TrainDetailsScreen
                connection={connectionWithFriends}
                onBack={handleBack}
                onConfirmPresence={handleJoinConnection}
                onRemovePresence={handleLeaveConnection}
                isUserOnConnection={isUserOnConnection}
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
