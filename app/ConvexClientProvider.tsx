"use client";

import type { FC, ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

type ConvexClientProviderProps = {
    children: ReactNode;
};

const ConvexClientProvider: FC<ConvexClientProviderProps> = ({ children }) => {
    return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>;
};

export default ConvexClientProvider;
