import type { LucideProps } from "lucide-react";
import { HelpCircle } from "lucide-react";

const defaultSize = 20;

export interface QuestionMarkIconProps extends Omit<LucideProps, "ref"> {
    size?: number;
}

export function QuestionMarkIcon({ size = defaultSize, ...props }: QuestionMarkIconProps) {
    return <HelpCircle size={size} aria-hidden {...props} />;
}
