"use client";

import { X } from "lucide-react";
import { motion } from "motion/react";
import styles from "./alert.module.scss";

interface AlertProps {
    message: string;
    type: "error" | "success";
    onDismiss?: () => void;
}

export function Alert({ message, type, onDismiss }: AlertProps) {
    const isError = type === "error";

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.alert}
            style={{
                backgroundColor: isError ? "rgba(220, 40, 30, 0.1)" : "rgba(0, 152, 95, 0.1)",
                borderColor: isError ? "rgba(220, 40, 30, 0.2)" : "rgba(0, 152, 95, 0.2)",
                color: isError ? "var(--color-error)" : "var(--color-success)",
            }}>
            {message}
            {onDismiss && (
                <button onClick={onDismiss} className={styles.closeButton}>
                    <X />
                </button>
            )}
        </motion.div>
    );
}
