"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useSession } from "@apis/hooks/useSession";
import { LoadingSpinner } from "@ui/atoms/loading-spinner";
import { HomeScreen } from "@ui/organisms/home-screen";

export default function App() {
    const router = useRouter();
    const { user, loading: authLoading } = useSession();

    // Redirect to sign in if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth/signin");
        }
    }, [user, authLoading, router]);

    // Show loading spinner while checking auth
    if (authLoading || !user) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <main>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}>
                <HomeScreen searchLoading={false} />
            </motion.div>
        </main>
    );
}
