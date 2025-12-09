"use client"

import { motion } from "motion/react"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import styles from './train-selection-screen.module.scss'
import { ConnectionCard } from "@/packages/ui/molecules/connection-card"
import type { Connection } from "@/types/vvs"

interface TrainSelectionScreenProps {
  connections: Connection[];
  onSelectConnection: (connection: Connection) => void;
  onBack: () => void;
  userConnectionId: string | null;
  stationName?: string;
}

export function TrainSelectionScreen({
  connections,
  onSelectConnection,
  onBack,
  userConnectionId,
  stationName = "Hauptbahnhof",
}: TrainSelectionScreenProps) {
  const currentTime = new Date();

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
            <h1 className={styles.headerTitle}>Available trains</h1>
            <p className={styles.headerSubtitle}>
              {stationName} · {format(currentTime, 'HH:mm')}
            </p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className={styles.connections}
        >
          {connections.map((connection, index) => (
            <motion.div
              key={connection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ConnectionCard
                connection={connection}
                onClick={() => onSelectConnection(connection)}
                isActive={userConnectionId === connection.id}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={styles.footer}
        >
          <div className={styles.footerInfo}>
            <AlertCircle className={styles.footerIcon} />
            <p className={styles.footerText}>
              Showing departures from Stuttgart {stationName}
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
