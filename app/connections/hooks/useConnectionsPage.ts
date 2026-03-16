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

type FriendsMap = Record<string, { id: string; name: string; avatarUrl: string | null }[]>;

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

    // Fetch friends for all visible connections
    const connectionIds = useMemo(() => rawConnections.map(c => c.id), [rawConnections]);
    const { data: friendsData } = useSWR(
        user && connectionIds.length > 0
            ? ["connections-friends", user.id, ...connectionIds]
            : null,
        () =>
            postFetcher<{ friends: FriendsMap }>("/api/connections/friends", {
                connectionIds,
            })
    );

    // Merge friends into connections
    const connections = useMemo(() => {
        const friendsMap = friendsData?.friends ?? {};
        return rawConnections.map(c => ({
            ...c,
            friends: (friendsMap[c.id] ?? []).map(f => ({
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
        return `/connections/${encodeURIComponent(connection.id)}?${params.toString()}`;
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
