"use client";

import { clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { ArrowLeftRight, Clock, MapPin } from "lucide-react";
import { motion } from "motion/react";
import type { Stop } from "@/packages/types/lib/types";
import styles from "./train-info-card.module.scss";

interface TrainInfoCardProps {
    departureTime: string;
    delay?: number;
    platform: string;
    stops: Stop[];
}

export function TrainInfoCard({ departureTime, delay = 0, platform, stops }: TrainInfoCardProps) {
    const departure = departureTime ? parseISO(departureTime) : null;
    const departureValid = departure && !isNaN(departure.getTime());

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.card}>
            <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                        <Clock className={styles.infoIcon} />
                        <span>Departure</span>
                    </div>
                    <p className={styles.infoValue}>
                        {departureValid ? format(departure, "HH:mm") : "–"}
                        {delay > 0 && <span className={styles.delay}> (+{delay} min)</span>}
                    </p>
                </div>
                <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                        <MapPin className={styles.infoIcon} />
                        <span>Platform</span>
                    </div>
                    <p className={styles.infoValue}>{platform || "–"}</p>
                </div>
            </div>

            <div className={styles.route}>
                <h3 className={styles.routeTitle}>Route</h3>
                <div className={styles.stops}>
                    {stops.map((stop, index) => {
                        const isFirst = index === 0;
                        const isLast = index === stops.length - 1;
                        const stopTime = stop.scheduledDeparture
                            ? parseISO(stop.scheduledDeparture)
                            : null;

                        return (
                            <div key={`${stop.station.id}-${index}`} className={styles.stop}>
                                <div className={styles.stopTimeline}>
                                    <div
                                        className={clsx(
                                            styles.stopDot,
                                            (isFirst || isLast) && styles.stopDotActive,
                                            stop.isTransfer && styles.stopDotTransfer
                                        )}
                                    />
                                    {!isLast && <div className={styles.stopLine} />}
                                </div>
                                <div className={styles.stopInfo}>
                                    <span
                                        className={clsx(
                                            styles.stopName,
                                            (isFirst || isLast) && styles.stopNameActive,
                                            stop.isTransfer && styles.stopNameTransfer
                                        )}>
                                        {stop.station.name}
                                        {stop.isTransfer && (
                                            <span className={styles.transferBadge}>
                                                <ArrowLeftRight className={styles.transferIcon} />
                                                Umstieg
                                            </span>
                                        )}
                                    </span>
                                    <span className={styles.stopTime}>
                                        {stopTime && !isNaN(stopTime.getTime())
                                            ? format(stopTime, "HH:mm")
                                            : "–"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
