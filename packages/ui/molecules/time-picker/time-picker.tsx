"use client";

import { Clock } from "lucide-react";
import { Input } from "@ui/atoms/input";
import styles from "./time-picker.module.scss";

export interface TimePickerProps {
    value?: string;
    onChange?: (time: string) => void;
    label?: string;
    className?: string;
}

export function TimePicker({
    value,
    onChange,
    label = "Uhrzeit",
    className = "",
}: TimePickerProps) {
    return (
        <div className={`${styles.timePicker} ${className}`}>
            <Clock className={styles.icon} />
            <label className={styles.label}>{label}</label>
            <Input
                type="time"
                value={value}
                onChange={e => onChange?.(e.target.value)}
                step="1"
                className={styles.input}
            />
        </div>
    );
}
