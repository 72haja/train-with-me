"use client";

import { FormEvent } from "react";
import { User } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@ui/atoms/button";
import { Input } from "@ui/atoms/input";
import styles from "./profile-form-section.module.scss";

interface ProfileFormSectionProps {
    fullName: string;
    onFullNameChange: (value: string) => void;
    onSubmit: (e: FormEvent) => void;
    loading: boolean;
    delay?: number;
}

export function ProfileFormSection({
    fullName,
    onFullNameChange,
    onSubmit,
    loading,
    delay = 0.1,
}: ProfileFormSectionProps) {
    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            onSubmit={onSubmit}
            className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile Information</h2>
            <div className={styles.field}>
                <label htmlFor="fullName" className={styles.label}>
                    <User className={styles.labelIcon} />
                    Full Name
                </label>
                <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => onFullNameChange(e.target.value)}
                    placeholder="Your name"
                    required
                />
            </div>
            <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
                Update Profile
            </Button>
        </motion.form>
    );
}
