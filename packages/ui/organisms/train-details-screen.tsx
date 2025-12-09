"use client"

import { motion } from "motion/react"
import { ArrowLeft, Clock, MapPin, Users, Circle } from "lucide-react"
import { format, parseISO } from "date-fns"
import styles from './train-details-screen.module.scss'
import { FriendCard } from "@/packages/ui/molecules/friend-card"
import type { Connection } from "@/types/vvs"

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
          <button 
            onClick={onBack} 
            className={styles.backButton}
            aria-label="Go back"
          >
            <ArrowLeft className={styles.backButtonIcon} />
          </button>
          <div className={styles.headerInfo}>
            <div
              className={styles.lineBadge}
              style={{ backgroundColor: connection.line.color }}
            >
              <span className={styles.lineNumber}>{connection.line.number}</span>
            </div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>{connection.line.direction}</h1>
              <p className={styles.headerSubtitle}>{format(departureTime, 'HH:mm')}</p>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Train Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.infoCard}
        >
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>
                <Clock className={styles.infoIcon} />
                <span>Departure</span>
              </div>
              <p className={styles.infoValue}>
                {format(departureTime, 'HH:mm')}
                {delay > 0 && <span className={styles.delay}> (+{delay} min)</span>}
              </p>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>
                <MapPin className={styles.infoIcon} />
                <span>Platform</span>
              </div>
              <p className={styles.infoValue}>{connection.departure.platform}</p>
            </div>
          </div>

          {/* Route */}
          <div className={styles.route}>
            <h3 className={styles.routeTitle}>Route</h3>
            <div className={styles.stops}>
              {connection.stops.map((stop, index) => {
                const isFirst = index === 0;
                const isLast = index === connection.stops.length - 1;
                const stopTime = parseISO(stop.scheduledDeparture);

                return (
                  <div key={`${stop.station.id}-${index}`} className={styles.stop}>
                    <div className={styles.stopTimeline}>
                      <Circle
                        className={`${styles.stopDot} ${
                          isFirst || isLast ? styles.stopDotActive : ''
                        }`}
                      />
                      {!isLast && <div className={styles.stopLine} />}
                    </div>
                    <div className={styles.stopInfo}>
                      <span
                        className={`${styles.stopName} ${
                          isFirst || isLast ? styles.stopNameActive : ''
                        }`}
                      >
                        {stop.station.name}
                      </span>
                      <span className={styles.stopTime}>{format(stopTime, 'HH:mm')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Confirm Presence Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={styles.actionSection}
        >
          <button
            onClick={() =>
              isUserOnConnection ? onRemovePresence() : onConfirmPresence(connection.id)
            }
            className={`${styles.actionButton} ${isUserOnConnection ? styles.active : ''}`}
          >
            {isUserOnConnection ? "You're on this train" : "I'm taking this train"}
          </button>
        </motion.div>

        {/* Friends Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.friendsCard}
        >
          <div className={styles.friendsHeader}>
            <Users className={styles.friendsIcon} />
            <h3 className={styles.friendsTitle}>
              {connection.friends.length === 0
                ? 'No friends yet'
                : connection.friends.length === 1
                ? '1 friend on board'
                : `${connection.friends.length} friends on board`}
            </h3>
          </div>

          {connection.friends.length > 0 ? (
            <div className={styles.friendsList}>
              {connection.friends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <FriendCard friend={friend} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Users className={styles.emptyIconSvg} />
              </div>
              <p className={styles.emptyText}>Be the first to join this train!</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
