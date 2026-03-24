"use client";

import Image from "next/image";
import { clsx } from "clsx";
import { MapPin } from "lucide-react";
import type { Friend, FriendOnConnection } from "@/packages/types/lib/types";
import styles from "./friend-card.module.scss";

interface FriendCardProps {
    friend: Friend | FriendOnConnection;
    className?: string;
}

const isFriendOnConnection = (
    friend: Friend | FriendOnConnection
): friend is FriendOnConnection => {
    return "originStationName" in friend;
};

export const FriendCard = ({ friend, className }: FriendCardProps) => {
    const hasRouteInfo = isFriendOnConnection(friend) && friend.originStationName;

    return (
        <div className={clsx(styles.card, className)}>
            <div className={styles.avatarWrapper}>
                <div className={styles.avatar}>
                    {friend.avatarUrl ? (
                        <Image
                            src={friend.avatarUrl}
                            alt={friend.name}
                            width={48}
                            height={48}
                            className={styles.avatarImage}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {friend.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                {friend.isOnline && <div className={styles.onlineIndicator} />}
            </div>
            <div className={styles.info}>
                <p className={styles.name}>{friend.name}</p>
                {hasRouteInfo ? (
                    <p className={styles.route}>
                        <MapPin className={styles.routeIcon} />
                        <span>
                            {friend.originStationName} → {friend.destinationStationName}
                        </span>
                    </p>
                ) : (
                    <p className={styles.status}>{friend.isOnline ? "Active now" : "Offline"}</p>
                )}
            </div>
        </div>
    );
};
