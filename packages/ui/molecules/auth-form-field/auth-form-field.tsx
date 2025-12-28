"use client";

import { ReactNode } from "react";
import styles from "./auth-form-field.module.scss";

interface AuthFormFieldProps {
    label: string;
    labelIcon: ReactNode;
    id: string;
    name: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    required?: boolean;
    minLength?: number;
}

export function AuthFormField({
    label,
    labelIcon,
    id,
    name,
    type,
    value,
    onChange,
    placeholder,
    required = false,
    minLength,
}: AuthFormFieldProps) {
    return (
        <div className={styles.field}>
            <label htmlFor={id} className={styles.label}>
                <span className={styles.labelIcon}>{labelIcon}</span>
                {label}
            </label>
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className={styles.input}
                placeholder={placeholder}
                required={required}
                minLength={minLength}
            />
        </div>
    );
}
