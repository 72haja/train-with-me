"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import useSWR from "swr";
import { useMyConnections } from "@/app/hooks/useMyConnections";
import { postFetcher } from "@/app/lib/fetcher";
import { api } from "@/convex/_generated/api";
import type { Connection } from "@/packages/types/lib/types";
import { useSession } from "@apis/hooks/useSession";
import { TrainDetailsScreen } from "@ui/organisms/train-details-screen";
import styles from "./page.module.scss";

const fetchConnection = async (
    connectionId: string,
    originId: string,
    destinationId: string,
    departure: string
): Promise<Connection | null> => {
    try {
        const stored = sessionStorage.getItem(`connection-${connectionId}`);
        if (stored) {
            return JSON.parse(stored) as Connection;
        }
    } catch {
        // ignore
    }

    const data = await postFetcher<{ connections: Connection[] }>("/api/connections/search", {
        originId,
        destinationId,
        date: departure.split("T")[0],
        time: departure.split("T")[1]?.slice(0, 5),
    });

    const match = (data.connections ?? []).find(c => c.id === connectionId) ?? null;

    if (match) {
        try {
            sessionStorage.setItem(`connection-${connectionId}`, JSON.stringify(match));
        } catch {
            // ignore
        }
    }

    return match;
};

const ConnectionDetailLoadingShell = ({ onBack }: { onBack: () => void }) => {
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
};

const ConnectionPageContent = () => {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading } = useSession();
    const { connectionIds } = useMyConnections();
    const [optimisticJoined, setOptimisticJoined] = useState<boolean | null>(null);

    const joinMutation = useMutation(api.userConnections.join);
    const leaveMutation = useMutation(api.userConnections.leave);

    const connectionId = params.id as string;
    const originId = searchParams.get("origin");
    const destinationId = searchParams.get("destination");
    const departure = searchParams.get("departure");

    const canFetch = !!connectionId && !!originId && !!destinationId && !!departure && !!user;

    const { data: connection, isLoading } = useSWR(
        canFetch ? ["connection-detail", connectionId, user?.id] : null,
        () =>
            fetchConnection(
                connectionId,
                originId as string,
                destinationId as string,
                departure as string
            ),
        { revalidateOnFocus: false }
    );

    const tripId = connection?.tripId ?? undefined;

    const friendsData = useQuery(
        api.userConnections.friendsOnConnection,
        user && connectionId ? { connectionId, tripId } : "skip"
    );

    const connectionWithFriends = connection
        ? {
              ...connection,
              friends: (friendsData ?? []).map(f => ({
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

    const isUserOnConnection =
        optimisticJoined !== null ? optimisticJoined : connectionIds.includes(connectionId);

    const handleBack = () => {
        router.back();
    };

    if (!authLoading && !user) {
        router.push("/auth/signin");
        return null;
    }

    const handleJoinConnection = async (connectionIdParam: string) => {
        if (!connection || !user) {
            return;
        }

        try {
            setOptimisticJoined(true);
            await joinMutation({
                connectionId: connectionIdParam,
                tripId: connection.tripId ?? undefined,
                originStationId: originId ?? undefined,
                originStationName: connection.departure.station.name,
                destinationStationId: destinationId ?? undefined,
                destinationStationName: connection.arrival.station.name,
                departureTime: connection.departure.scheduledDeparture,
                arrivalTime: connection.arrival.scheduledDeparture,
                lineNumber: connection.line.number,
                lineType: connection.line.type,
                lineColor: connection.line.color,
                lineDirection: connection.line.direction,
            });
        } catch (err) {
            setOptimisticJoined(null);
            console.error("Error joining connection:", err);
        }
    };

    const handleLeaveConnection = async () => {
        if (!connection) {
            return;
        }

        try {
            setOptimisticJoined(false);
            await leaveMutation({ connectionId });
        } catch (err) {
            setOptimisticJoined(null);
            console.error("Error leaving connection:", err);
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
};

const ConnectionPage = () => {
    return (
        <Suspense fallback={<ConnectionDetailLoadingShell onBack={() => window.history.back()} />}>
            <ConnectionPageContent />
        </Suspense>
    );
};

export default ConnectionPage;
