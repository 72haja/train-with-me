import { useMyConnections } from "@/app/hooks/useMyConnections";

export function useJoinedConnectionIds() {
    const { connectionIds } = useMyConnections();
    return connectionIds;
}
