"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Clock, MapPin, Users } from "lucide-react";
import { motion } from "motion/react";
import type { Connection } from "@/packages/types/lib/types";
import { FavoriteButton } from "@ui/atoms/favorite-button";
import { clsx } from "clsx";
import { FriendAvatarGroup } from "@ui/molecules/friend-avatar-group";
import styles from "./connection-card.module.scss";

interface ConnectionCardProps {
    connection: Connection;
    onClick: () => void;
    isActive?: boolean;
    className?: string;
    onToggleFavorite?: (originId: string, destinationId: string, isFavorite: boolean) => void;
    isFavorite?: boolean;
}

export function ConnectionCard({
    connection,
    onClick,
    isActive = false,
    className,
    onToggleFavorite,
    isFavorite = false,
}: ConnectionCardProps) {
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const departureTime = parseISO(connection.departure.scheduledDeparture);
    const actualDepartureTime = connection.departure.actualDeparture
        ? parseISO(connection.departure.actualDeparture)
        : null;
    const delay = connection.departure.delay || 0;

    const handleToggleFavorite = async () => {
        if (!onToggleFavorite) return;

        setFavoriteLoading(true);
        try {
            await onToggleFavorite(
                connection.departure.station.id,
                connection.arrival.station.id,
                isFavorite
            );
        } finally {
            setFavoriteLoading(false);
        }
    };

    return (
        <div className={styles.cardWrapper}>
            <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onClick}
                className={clsx(styles.card, isActive && styles.active, className)}>
                <div className={styles.content}>
                    <div
                        className={styles.lineBadge}
                        style={{ backgroundColor: connection.line.color }}>
                        <span className={styles.lineNumber}>{connection.line.number}</span>
                    </div>

                    <div className={styles.info}>
                        <div className={styles.topRow}>
                            <div className={styles.route}>
                                <MapPin className={styles.icon} />
                                <span className={styles.routeText}>
                                    <span className={styles.station}>
                                        {connection.departure.station.name}
                                    </span>
                                    <span className={styles.arrow}>→</span>
                                    <span className={styles.station}>
                                        {connection.arrival.station.name}
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className={styles.timeRow}>
                            <Clock className={styles.iconSmall} />
                            <span className={styles.timeText}>
                                {format(actualDepartureTime || departureTime, "HH:mm")}
                            </span>
                            {delay > 0 && <span className={styles.delay}>+{delay} min</span>}
                            {delay < 0 && <span className={styles.early}>{delay} min</span>}
                            <span className={styles.separator}>·</span>
                            <span className={styles.platform}>
                                Platform {connection.departure.platform}
                            </span>
                        </div>

                        {connection.friends.length > 0 ? (
                            <div className={styles.friends}>
                                <FriendAvatarGroup friends={connection.friends} max={3} />
                                <span className={styles.friendsText}>
                                    {connection.friends.length === 1
                                        ? `${connection.friends[0]!.name} is riding`
                                        : `${connection.friends.length} friends riding`}
                                </span>
                            </div>
                        ) : (
                            <div className={styles.noFriends}>
                                <Users className={styles.iconSmall} />
                                <span className={styles.noFriendsText}>
                                    No friends on this train
                                </span>
                            </div>
                        )}
                    </div>

                    {isActive && <div className={styles.activeIndicator} />}
                </div>
            </motion.button>

            {onToggleFavorite && (
                <div onClick={e => e.stopPropagation()}>
                    <FavoriteButton
                        isFavorite={isFavorite}
                        isLoading={favoriteLoading}
                        onClick={handleToggleFavorite}
                    />
                </div>
            )}
        </div>
    );
}
