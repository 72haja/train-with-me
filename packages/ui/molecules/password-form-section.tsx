"use client";

import { FormEvent } from "react";
import { motion } from "motion/react";
import { Button } from "@ui/atoms/button";
import { PasswordInput } from "@ui/molecules/password-input";
import styles from "./password-form-section.module.scss";

interface PasswordFormSectionProps {
    password: string;
    confirmPassword: string;
    onPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
    onSubmit: (e: FormEvent) => void;
    loading: boolean;
    delay?: number;
}

export function PasswordFormSection({
    password,
    confirmPassword,
    onPasswordChange,
    onConfirmPasswordChange,
    onSubmit,
    loading,
    delay = 0.3,
}: PasswordFormSectionProps) {
    const passwordsMismatch = password && confirmPassword && password !== confirmPassword;

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            onSubmit={onSubmit}
            className={styles.section}>
            <h2 className={styles.sectionTitle}>Password</h2>
            <div className={styles.field}>
                <PasswordInput
                    id="password"
                    name="password"
                    value={password}
                    onChange={onPasswordChange}
                    placeholder="••••••••"
                    label="New Password"
                    required
                    minLength={8}
                    showStrength={true}
                />
            </div>
            <div className={styles.field}>
                <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onConfirmPasswordChange}
                    placeholder="••••••••"
                    label="Confirm Password"
                    required
                    minLength={8}
                    showStrength={false}
                />
            </div>
            {passwordsMismatch && <div className={styles.errorMessage}>Passwords do not match</div>}
            <Button type="submit" variant="secondary" size="md" fullWidth loading={loading}>
                Update Password
            </Button>
        </motion.form>
    );
}
