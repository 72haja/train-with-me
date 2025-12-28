"use client";

import { Train } from "lucide-react";
import { motion } from "motion/react";
import styles from "./auth-header.module.scss";

interface AuthHeaderProps {
    subtitle: string;
}

export function AuthHeader({ subtitle }: AuthHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.header}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}>
                    <Train className={styles.logoIconSvg} />
                </div>
                <h1 className={styles.logoText}>VVS Together</h1>
            </div>
            <p className={styles.subtitle}>{subtitle}</p>
        </motion.div>
    );
}
