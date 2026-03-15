import type { LucideProps } from "lucide-react";
import { AlertCircle } from "lucide-react";

const defaultSize = 20;

export interface ExclamationMarkIconProps extends Omit<LucideProps, "ref"> {
    size?: number;
}

export function ExclamationMarkIcon({ size = defaultSize, ...props }: ExclamationMarkIconProps) {
    return <AlertCircle size={size} aria-hidden {...props} />;
}
