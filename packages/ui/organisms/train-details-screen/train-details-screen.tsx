"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import type { Connection } from "@/packages/types/lib/types";
import { FavoriteButton } from "@ui/atoms/favorite-button/";
import { FriendsOnTrainSection } from "@ui/molecules/friends-on-train-section";
import { TrainInfoCard } from "@ui/molecules/train-info-card";
import styles from "./train-details-screen.module.scss";

interface TrainDetailsScreenProps {
    connection: Connection;
    onBack: () => void;
    onConfirmPresence: (connectionId: string) => void;
    onRemovePresence: () => void;
    isUserOnConnection: boolean;
    onToggleFavorite?: (originId: string, destinationId: string, isFavorite: boolean) => void;
    isFavorite?: boolean;
}

export function TrainDetailsScreen({
    connection,
    onBack,
    onConfirmPresence,
    onRemovePresence,
    isUserOnConnection,
    onToggleFavorite,
    isFavorite = false,
}: TrainDetailsScreenProps) {
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const departureTime = parseISO(connection.departure.scheduledDeparture);
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
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <button onClick={onBack} className={styles.backButton} aria-label="Go back">
                        <ArrowLeft className={styles.backButtonIcon} />
                    </button>
                    <div className={styles.headerInfo}>
                        <div
                            className={styles.lineBadge}
                            style={{ backgroundColor: connection.line.color }}>
                            <span className={styles.lineNumber}>{connection.line.number}</span>
                        </div>
                        <div className={styles.headerText}>
                            <h1 className={styles.headerTitle}>
                                <span className={styles.station}>
                                    {connection.departure.station.name}
                                </span>
                                <span className={styles.arrow}>→</span>
                                <span className={styles.station}>
                                    {connection.arrival.station.name}
                                </span>
                            </h1>
                            <p className={styles.headerSubtitle}>
                                {format(departureTime, "HH:mm")}
                            </p>
                        </div>
                    </div>
                    {onToggleFavorite && (
                        <FavoriteButton
                            isFavorite={isFavorite}
                            isLoading={favoriteLoading}
                            onClick={handleToggleFavorite}
                            iconSize="md"
                        />
                    )}
                </div>
            </header>

            <main className={styles.main}>
                <TrainInfoCard
                    departureTime={connection.departure.scheduledDeparture}
                    delay={delay}
                    platform={connection.departure.platform}
                    stops={connection.stops}
                />

                {/* Confirm Presence Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={styles.actionSection}>
                    <button
                        onClick={() =>
                            isUserOnConnection
                                ? onRemovePresence()
                                : onConfirmPresence(connection.id)
                        }
                        className={clsx(styles.actionButton, isUserOnConnection && styles.active)}>
                        {isUserOnConnection ? "You're on this train" : "I'm taking this train"}
                    </button>
                </motion.div>

                <FriendsOnTrainSection friends={connection.friends} />
            </main>
        </div>
    );
}
