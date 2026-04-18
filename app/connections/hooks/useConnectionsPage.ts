"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Connection, DbFavoriteConnection, Friend } from "@/packages/types/lib/types";
import { useConnectionsSearch } from "./useConnectionsSearch";
import type { ConnectionsSearchParams } from "./useConnectionsSearch";
import { useFavorites, useRouteFavoriteToggle } from "./useFavorites";
import { useJoinedConnectionIds } from "./useJoinedConnectionIds";

export type UseConnectionsPageParams = {
    searchParams: ConnectionsSearchParams;
    initialConnections: Connection[];
    initialFavorites: DbFavoriteConnection[];
};

export const useConnectionsPage = ({
    searchParams,
    initialConnections,
    initialFavorites,
}: UseConnectionsPageParams) => {
    const router = useRouter();
    const { originId, destinationId, date, time } = searchParams;

    const {
        connections: rawConnections,
        isLoading,
        errorMessage,
        loadEarlier,
        loadLater,
        loadingEarlier,
        loadingLater,
    } = useConnectionsSearch(searchParams, initialConnections);

    const { toggleFavorite, isFavorite } = useFavorites(initialFavorites);
    const routeFavorite = useRouteFavoriteToggle(originId, destinationId, {
        isFavorite,
        toggleFavorite,
    });

    const joinedConnectionIds = useJoinedConnectionIds();

    const tripIds = useMemo(
        () => [...new Set(rawConnections.map(c => c.tripId).filter(Boolean))],
        [rawConnections]
    );

    const friendsMap = useQuery(
        api.userConnections.friendsOnTrips,
        tripIds.length > 0 ? { tripIds } : "skip"
    );

    const connections = useMemo(() => {
        const map = friendsMap ?? {};
        return rawConnections.map(c => ({
            ...c,
            friends: (map[c.tripId] ?? []).map(f => ({
                id: f.id,
                name: f.name,
                avatarUrl: f.avatarUrl ?? undefined,
                isOnline: false,
            })) as Friend[],
        }));
    }, [rawConnections, friendsMap]);

    const getConnectionHref = (connection: Connection) => {
        const params = new URLSearchParams({
            origin: originId,
            destination: destinationId,
            departure: connection.departure.scheduledDeparture,
        });
        return `/connections/${connection.id}?${params.toString()}`;
    };

    const handleBack = () => {
        router.push("/");
    };

    return {
        date,
        time,
        connections,
        isLoading,
        errorMessage,
        isRouteFavorite: routeFavorite.isRouteFavorite,
        favoriteLoading: routeFavorite.loading,
        handleHeaderToggleFavorite: routeFavorite.handleToggle,
        joinedConnectionIds,
        loadEarlier,
        loadLater,
        loadingEarlier,
        loadingLater,
        getConnectionHref,
        handleBack,
        isFavorite,
        toggleFavorite,
    };
};
