"use client";

import { motion } from "motion/react";
import styles from "./auth-footer.module.scss";

export function AuthFooter() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={styles.footer}>
            <p className={styles.footerText}>
                VVS Together is for private friend groups only.
                <br />
                Not intended for collecting PII or securing sensitive data.
            </p>
        </motion.div>
    );
}
