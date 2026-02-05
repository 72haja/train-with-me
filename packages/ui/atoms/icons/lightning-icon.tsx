import type { LucideProps } from "lucide-react";
import { Zap } from "lucide-react";

const defaultSize = 20;

export interface LightningIconProps extends Omit<LucideProps, "ref"> {
    size?: number;
}

export function LightningIcon({ size = defaultSize, ...props }: LightningIconProps) {
    return <Zap size={size} aria-hidden {...props} />;
}
