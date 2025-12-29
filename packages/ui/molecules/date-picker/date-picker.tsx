"use client";

import { useMemo } from "react";
import * as React from "react";
import clsx from "clsx";
import { addDays, format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Select, type SelectOption } from "@ui/atoms/select";
import styles from "./date-picker.module.scss";

export interface DatePickerProps {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    className?: string;
}

interface DateOption {
    value: string;
    label: string;
    date: Date;
}

export function DatePicker({ value, onChange, className = "" }: DatePickerProps) {
    // Generate date options: "heute" + next 30 days
    const { dateOptions, selectOptions } = useMemo(() => {
        const options: DateOption[] = [];
        const selectOpts: SelectOption[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add "heute" as first option
        const todayISO = today.toISOString();
        options.push({
            value: todayISO,
            label: "Heute",
            date: new Date(today),
        });
        selectOpts.push({
            value: todayISO,
            label: "Heute",
        });

        // Add next 30 days
        for (let i = 1; i <= 30; i++) {
            const date = addDays(today, i);
            let label: string;

            if (i === 1) {
                label = "Morgen";
            } else {
                // Format as "Montag, 15. Januar" or "15. Januar" if more than a week away
                const daysDiff = Math.floor(
                    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );
                if (daysDiff <= 7) {
                    label = format(date, "EEEE, d. MMMM", { locale: de });
                } else {
                    label = format(date, "d. MMMM", { locale: de });
                }
            }

            const dateISO = date.toISOString();
            options.push({
                value: dateISO,
                label,
                date: new Date(date),
            });
            selectOpts.push({
                value: dateISO,
                label,
            });
        }

        return { dateOptions: options, selectOptions: selectOpts };
    }, []);

    // Find the selected value based on the date value
    const selectedValue = useMemo(() => {
        if (!value) {
            return dateOptions[0]!.value;
        }
        const valueDate = new Date(value);
        valueDate.setHours(0, 0, 0, 0);
        const valueISO = valueDate.toISOString();
        return dateOptions.find(opt => opt.value === valueISO)?.value || dateOptions[0]!.value;
    }, [value, dateOptions]);

    const handleChange = (selectedValue: string) => {
        const selectedOption = dateOptions.find(opt => opt.value === selectedValue);
        onChange?.(selectedOption?.date);
    };

    return (
        <div className={clsx(styles.datePicker, className)}>
            <CalendarIcon className={styles.icon} />
            <label className={styles.label}>Datum</label>
            <Select
                options={selectOptions}
                value={selectedValue}
                onChange={handleChange as (value: string) => void}
                className={styles.select}
            />
        </div>
    );
}
