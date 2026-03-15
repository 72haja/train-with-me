"use client";

import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Train } from "lucide-react";
import { useMyConnections } from "@/app/hooks/useMyConnections";
import { FriendAvatarGroup } from "@ui/molecules/friend-avatar-group";
import styles from "./my-connections.module.scss";

export function MyConnections() {
    const router = useRouter();
    const { connections } = useMyConnections();

    // Only show connections that have metadata (joined after the schema update)
    const validConnections = connections.filter(c => c.lineNumber && c.originStationName);

    if (validConnections.length === 0) return null;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Meine Züge</h3>
            <div className={styles.card}>
                {validConnections.map(c => {
                    const depTime = c.departureTime ? parseISO(c.departureTime) : null;
                    const arrTime = c.arrivalTime ? parseISO(c.arrivalTime) : null;
                    const timeValid = (d: Date | null) => d && !isNaN(d.getTime());

                    const handleClick = () => {
                        const params = new URLSearchParams();
                        if (c.originStationId) params.set("origin", c.originStationId);
                        if (c.destinationStationId)
                            params.set("destination", c.destinationStationId);
                        if (c.departureTime) params.set("departure", c.departureTime);
                        router.push(
                            `/connections/${encodeURIComponent(c.id)}?${params.toString()}`
                        );
                    };

                    return (
                        <button
                            key={c.id}
                            type="button"
                            onClick={handleClick}
                            className={styles.item}>
                            <span
                                className={styles.badge}
                                style={{ backgroundColor: c.lineColor ?? "#666" }}>
                                {c.lineNumber ?? "?"}
                            </span>
                            <span className={styles.info}>
                                <span className={styles.route}>
                                    {c.originStationName ?? "–"}
                                    <span className={styles.arrow}>→</span>
                                    {c.destinationStationName ?? "–"}
                                </span>
                                <span className={styles.times}>
                                    {timeValid(depTime)
                                        ? format(depTime!, "EEE, d. MMM · HH:mm", { locale: de })
                                        : "--:--"}
                                    {timeValid(arrTime) && <> – {format(arrTime!, "HH:mm")}</>}
                                </span>
                            </span>
                            {c.friends.length > 0 ? (
                                <FriendAvatarGroup
                                    friends={c.friends.map(f => ({
                                        id: f.id,
                                        name: f.name,
                                        avatarUrl: f.avatarUrl ?? undefined,
                                        isOnline: false,
                                    }))}
                                    max={3}
                                />
                            ) : (
                                <Train className={styles.trainIcon} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
