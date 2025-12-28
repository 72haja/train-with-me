"use client";

import { FormEvent } from "react";
import { Mail } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@ui/atoms/button";
import { Input } from "@ui/atoms/input";
import styles from "./email-form-section.module.scss";

interface EmailFormSectionProps {
    email: string;
    onEmailChange: (value: string) => void;
    onSubmit: (e: FormEvent) => void;
    loading: boolean;
    delay?: number;
}

export function EmailFormSection({
    email,
    onEmailChange,
    onSubmit,
    loading,
    delay = 0.2,
}: EmailFormSectionProps) {
    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            onSubmit={onSubmit}
            className={styles.section}>
            <h2 className={styles.sectionTitle}>Email</h2>
            <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>
                    <Mail className={styles.labelIcon} />
                    Email Address
                </label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => onEmailChange(e.target.value)}
                    placeholder="your@email.com"
                    required
                />
            </div>
            <Button type="submit" variant="secondary" size="md" fullWidth loading={loading}>
                Update Email
            </Button>
        </motion.form>
    );
}
