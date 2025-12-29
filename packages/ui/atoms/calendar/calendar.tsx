"use client";

import * as React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import styles from "./calendar.module.scss";

export type CalendarProps = DayPickerProps;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={clsx(styles.calendar, className)}
            classNames={{
                months: styles.months,
                month: styles.month,
                caption: styles.caption,
                caption_label: styles.captionLabel,
                nav: styles.nav,
                nav_button: styles.navButton,
                nav_button_previous: styles.navButtonPrevious,
                nav_button_next: styles.navButtonNext,
                table: styles.table,
                head_row: styles.headRow,
                head_cell: styles.headCell,
                row: styles.row,
                cell: styles.cell,
                day: styles.day,
                day_selected: styles.daySelected,
                day_today: styles.dayToday,
                day_outside: styles.dayOutside,
                day_disabled: styles.dayDisabled,
                day_range_middle: styles.dayRangeMiddle,
                day_hidden: styles.dayHidden,
                ...classNames,
            }}
            components={{
                IconLeft: () => <ChevronLeft className={styles.icon} />,
                IconRight: () => <ChevronRight className={styles.icon} />,
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };

