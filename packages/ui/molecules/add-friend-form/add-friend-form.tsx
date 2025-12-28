"use client";

import { FormEvent } from "react";
import { Mail, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@ui/atoms/button";
import { Input } from "@ui/atoms/input";
import styles from "./add-friend-form.module.scss";

interface AddFriendFormProps {
    email: string;
    onEmailChange: (email: string) => void;
    onSubmit: (e: FormEvent) => void;
    loading: boolean;
    onEmailChangeClearError?: () => void;
}

export function AddFriendForm({
    email,
    onEmailChange,
    onSubmit,
    loading,
    onEmailChangeClearError,
}: AddFriendFormProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.section}>
            <h2 className={styles.sectionTitle}>Add Friend</h2>
            <form onSubmit={onSubmit} className={styles.form} noValidate>
                <div className={styles.field}>
                    <label htmlFor="email" className={styles.label}>
                        <Mail className={styles.labelIcon} />
                        Email Address
                    </label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => {
                            onEmailChange(e.target.value);
                            onEmailChangeClearError?.();
                        }}
                        placeholder="friend@example.com"
                    />
                </div>
                <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
                    <UserPlus className={styles.buttonIcon} />
                    Send Friend Request
                </Button>
            </form>
        </motion.div>
    );
}
