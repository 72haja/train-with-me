"use client";

import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import type { Connection } from "@/packages/types/lib/types";
import { FriendsOnTrainSection } from "@ui/molecules/friends-on-train-section";
import { TrainInfoCard } from "@ui/molecules/train-info-card";
import styles from "./train-details-screen.module.scss";

interface TrainDetailsScreenProps {
    connection: Connection;
    onBack: () => void;
    onConfirmPresence: (connectionId: string) => void;
    onRemovePresence: () => void;
    isUserOnConnection: boolean;
}

export function TrainDetailsScreen({
    connection,
    onBack,
    onConfirmPresence,
    onRemovePresence,
    isUserOnConnection,
}: TrainDetailsScreenProps) {
    const departureTime = parseISO(connection.departure.scheduledDeparture);
    const delay = connection.departure.delay || 0;

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
                            <h1 className={styles.headerTitle}>{connection.line.direction}</h1>
                            <p className={styles.headerSubtitle}>
                                {format(departureTime, "HH:mm")}
                            </p>
                        </div>
                    </div>
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
                        className={`${styles.actionButton} ${isUserOnConnection ? styles.active : ""}`}>
                        {isUserOnConnection ? "You're on this train" : "I'm taking this train"}
                    </button>
                </motion.div>

                <FriendsOnTrainSection friends={connection.friends} />
            </main>
        </div>
    );
}
