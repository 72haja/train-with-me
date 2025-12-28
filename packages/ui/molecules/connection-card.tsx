"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Clock, MapPin, Star, Users } from "lucide-react";
import { motion } from "motion/react";
import type { Connection } from "@/packages/types/lib/types";
import { FriendAvatarGroup } from "@ui/molecules/friend-avatar-group";
import styles from "./connection-card.module.scss";

interface ConnectionCardProps {
    connection: Connection;
    onClick: () => void;
    isActive?: boolean;
    className?: string;
    onAddToFavorites?: (originId: string, destinationId: string) => void;
    isFavorite?: boolean;
}

export function ConnectionCard({
    connection,
    onClick,
    isActive = false,
    className,
    onAddToFavorites,
    isFavorite = false,
}: ConnectionCardProps) {
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const departureTime = parseISO(connection.departure.scheduledDeparture);
    const actualDepartureTime = connection.departure.actualDeparture
        ? parseISO(connection.departure.actualDeparture)
        : null;
    const delay = connection.departure.delay || 0;

    const handleAddToFavorites = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onAddToFavorites) return;

        setFavoriteLoading(true);
        try {
            await onAddToFavorites(connection.departure.station.id, connection.arrival.station.id);
        } finally {
            setFavoriteLoading(false);
        }
    };

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`${styles.card} ${isActive ? styles.active : ""} ${className || ""}`}>
            <button
                type="button"
                onClick={onClick}
                className={styles.cardButton}
                style={{
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: 0,
                }}>
                <div className={styles.content}>
                    <div
                        className={styles.lineBadge}
                        style={{ backgroundColor: connection.line.color }}>
                        <span className={styles.lineNumber}>{connection.line.number}</span>
                    </div>

                    <div className={styles.info}>
                        <div className={styles.topRow}>
                            <div className={styles.destination}>
                                <MapPin className={styles.icon} />
                                <span className={styles.destinationText}>
                                    {connection.line.direction}
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
            </button>

            {onAddToFavorites && (
                <button
                    type="button"
                    onClick={handleAddToFavorites}
                    disabled={favoriteLoading || isFavorite}
                    className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteButtonActive : ""}`}
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                    <Star
                        className={`${styles.favoriteIcon} ${isFavorite ? styles.favoriteIconActive : ""}`}
                        fill={isFavorite ? "currentColor" : "none"}
                    />
                </button>
            )}
        </motion.div>
    );
}
