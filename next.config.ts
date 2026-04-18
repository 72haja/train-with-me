import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactCompiler: true,
    cacheComponents: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "*.convex.cloud",
                port: "",
                pathname: "/api/storage/**",
            },
        ],
    },
};

export default nextConfig;
