"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { postFetcher } from "@/app/lib/fetcher";
import type { Connection, DbFavoriteConnection, Friend } from "@/packages/types/lib/types";
import { useSession } from "@apis/hooks/useSession";
import { useConnectionsSearch } from "./useConnectionsSearch";
import type { ConnectionsSearchParams } from "./useConnectionsSearch";
import { useFavorites, useRouteFavoriteToggle } from "./useFavorites";
import { useJoinedConnectionIds } from "./useJoinedConnectionIds";

type FriendOnConnectionResponse = {
    id: string;
    name: string;
    avatarUrl: string | null;
    originStationName: string | null;
    destinationStationName: string | null;
    departureTime: string | null;
    arrivalTime: string | null;
};

type FriendsMap = Record<string, FriendOnConnectionResponse[]>;

export type UseConnectionsPageParams = {
    searchParams: ConnectionsSearchParams;
    initialConnections: Connection[];
    initialFavorites: DbFavoriteConnection[];
};

export function useConnectionsPage({
    searchParams,
    initialConnections,
    initialFavorites,
}: UseConnectionsPageParams) {
    const router = useRouter();
    const { user } = useSession();
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

    // Fetch friends for all visible connections using tripId (same physical train)
    const tripIds = useMemo(
        () => [...new Set(rawConnections.map(c => c.tripId).filter(Boolean))],
        [rawConnections]
    );
    const { data: friendsData } = useSWR(
        user && tripIds.length > 0 ? ["connections-friends", user.id, ...tripIds] : null,
        () =>
            postFetcher<{ friends: FriendsMap }>("/api/connections/friends", {
                tripIds,
            })
    );

    // Merge friends into connections (keyed by tripId)
    const connections = useMemo(() => {
        const friendsMap = friendsData?.friends ?? {};
        return rawConnections.map(c => ({
            ...c,
            friends: (friendsMap[c.tripId] ?? []).map(f => ({
                id: f.id,
                name: f.name,
                avatarUrl: f.avatarUrl ?? undefined,
                isOnline: false,
            })) as Friend[],
        }));
    }, [rawConnections, friendsData]);

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
        // search params for display
        date,
        time,
        // connections list
        connections,
        isLoading,
        errorMessage,
        // favorites (route-level)
        isRouteFavorite: routeFavorite.isRouteFavorite,
        favoriteLoading: routeFavorite.loading,
        handleHeaderToggleFavorite: routeFavorite.handleToggle,
        // "my train" highlight
        joinedConnectionIds,
        // pagination
        loadEarlier,
        loadLater,
        loadingEarlier,
        loadingLater,
        // actions
        getConnectionHref,
        handleBack,
        // for card-level favorite check (if needed)
        isFavorite,
        toggleFavorite,
    };
}
