"use client";

import { useRouter } from "next/navigation";
import type { Connection, DbFavoriteConnection } from "@/packages/types/lib/types";
import { useConnectionsSearch } from "./useConnectionsSearch";
import type { ConnectionsSearchParams } from "./useConnectionsSearch";
import { useFavorites, useRouteFavoriteToggle } from "./useFavorites";
import { useJoinedConnectionIds } from "./useJoinedConnectionIds";

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
    const { originId, destinationId, date, time } = searchParams;

    const {
        connections,
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

    const handleSelectConnection = (connection: Connection) => {
        // Store the full connection data for the detail page
        try {
            sessionStorage.setItem(`connection-${connection.id}`, JSON.stringify(connection));
        } catch {
            // sessionStorage not available
        }
        // Include search context so the detail page can re-fetch if sessionStorage is empty
        const params = new URLSearchParams({
            origin: originId,
            destination: destinationId,
            departure: connection.departure.scheduledDeparture,
        });
        router.push(`/connections/${connection.id}?${params.toString()}`);
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
        handleSelectConnection,
        handleBack,
        // for card-level favorite check (if needed)
        isFavorite,
        toggleFavorite,
    };
}
