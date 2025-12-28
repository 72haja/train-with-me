"use client";

import { useCallback, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { Input } from "@ui/atoms/input";
import styles from "./password-input.module.scss";

export interface PasswordStrength {
    score: number; // 0-4
    label: "Very Weak" | "Weak" | "Fair" | "Good" | "Strong";
    checks: {
        length: boolean;
        lowercase: boolean;
        uppercase: boolean;
        number: boolean;
        symbol: boolean;
    };
}

interface PasswordInputProps {
    id?: string;
    name?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    minLength?: number;
    showStrength?: boolean;
    className?: string;
}

export function PasswordInput({
    id,
    name,
    value,
    onChange,
    placeholder = "••••••••",
    label,
    required = false,
    minLength = 8,
    showStrength = true,
    className,
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    const calculateStrength = useCallback(
        (password: string): PasswordStrength => {
            const checks = {
                length: password.length >= minLength,
                lowercase: /[a-z]/.test(password),
                uppercase: /[A-Z]/.test(password),
                number: /[0-9]/.test(password),
                symbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
            };

            const passedChecks = Object.values(checks).filter(Boolean).length;
            let score = 0;
            let label: PasswordStrength["label"] = "Very Weak";

            if (passedChecks === 0) {
                score = 0;
                label = "Very Weak";
            } else if (passedChecks === 1 || passedChecks === 2) {
                score = 1;
                label = "Weak";
            } else if (passedChecks === 3) {
                score = 2;
                label = "Fair";
            } else if (passedChecks === 4) {
                score = 3;
                label = "Good";
            } else if (passedChecks === 5) {
                score = 4;
                label = "Strong";
            }

            return { score, label, checks };
        },
        [minLength]
    );

    const strength = value ? calculateStrength(value) : null;

    return (
        <div className={`${styles.container} ${className || ""}`}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.inputWrapper}>
                <Input
                    id={id}
                    name={name}
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    minLength={minLength}
                    className={styles.input}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.toggleButton}
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? (
                        <EyeOff className={styles.toggleIcon} />
                    ) : (
                        <Eye className={styles.toggleIcon} />
                    )}
                </button>
            </div>

            {showStrength && value && strength && (
                <div className={styles.strengthIndicator}>
                    <div className={styles.strengthBar}>
                        <div
                            className={`${styles.strengthFill} ${styles[`strength${strength.score}`]}`}
                            style={{ width: `${((strength.score + 1) / 5) * 100}%` }}
                        />
                    </div>
                    <div className={styles.strengthLabel}>
                        <span className={styles[`strengthText${strength.score}`]}>
                            {strength.label}
                        </span>
                    </div>
                    <div className={styles.requirements}>
                        <div
                            className={`${styles.requirement} ${strength.checks.length ? styles.passed : ""}`}>
                            {strength.checks.length ? (
                                <Check className={styles.checkIcon} />
                            ) : (
                                <X className={styles.xIcon} />
                            )}
                            <span>At least {minLength} characters</span>
                        </div>
                        <div
                            className={`${styles.requirement} ${strength.checks.lowercase ? styles.passed : ""}`}>
                            {strength.checks.lowercase ? (
                                <Check className={styles.checkIcon} />
                            ) : (
                                <X className={styles.xIcon} />
                            )}
                            <span>Lowercase letter</span>
                        </div>
                        <div
                            className={`${styles.requirement} ${strength.checks.uppercase ? styles.passed : ""}`}>
                            {strength.checks.uppercase ? (
                                <Check className={styles.checkIcon} />
                            ) : (
                                <X className={styles.xIcon} />
                            )}
                            <span>Uppercase letter</span>
                        </div>
                        <div
                            className={`${styles.requirement} ${strength.checks.number ? styles.passed : ""}`}>
                            {strength.checks.number ? (
                                <Check className={styles.checkIcon} />
                            ) : (
                                <X className={styles.xIcon} />
                            )}
                            <span>Number</span>
                        </div>
                        <div
                            className={`${styles.requirement} ${strength.checks.symbol ? styles.passed : ""}`}>
                            {strength.checks.symbol ? (
                                <Check className={styles.checkIcon} />
                            ) : (
                                <X className={styles.xIcon} />
                            )}
                            <span>Special character</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
