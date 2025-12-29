"use client";

import { useRef } from "react";
import { MapPin, Train, Users } from "lucide-react";
import { motion } from "motion/react";
import { FavoriteConnections } from "@ui/molecules/favorite-connections";
import { RouteSearchForm, type RouteSearchFormRef } from "@ui/molecules/route-search-form";
import { UserMenu } from "@ui/molecules/user-menu";
import styles from "./home-screen.module.scss";

interface HomeScreenProps {
    onNavigateToSelection: () => void;
    onSearchRoute?: (originId: string, destinationId: string, departureTime: string) => void;
    searchLoading?: boolean;
}

export function HomeScreen({
    onNavigateToSelection,
    onSearchRoute,
    searchLoading = false,
}: HomeScreenProps) {
    const searchFormRef = useRef<RouteSearchFormRef>(null);

    const handleFavoriteSelect = (originId: string, destinationId: string) => {
        if (searchFormRef.current) {
            searchFormRef.current.setRoute(originId, destinationId);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <Train className={styles.logoIconSvg} />
                    </div>
                    <h1 className={styles.logoText}>VVS Together</h1>
                </motion.div>
                <div className={styles.userMenu}>
                    <UserMenu />
                </div>
            </header>

            <main className={styles.main}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={styles.hero}>
                    <div className={styles.heroIcon}>
                        <Users className={styles.heroIconSvg} />
                    </div>

                    <h2 className={styles.heroTitle}>Ride together with friends</h2>

                    <p className={styles.heroDescription}>
                        See which of your friends are taking the same VVS train and coordinate your
                        journey in real-time.
                    </p>

                    {onSearchRoute ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className={styles.searchForm}>
                            <RouteSearchForm
                                ref={searchFormRef}
                                onSearch={onSearchRoute}
                                loading={searchLoading}
                            />
                            <FavoriteConnections onSelectFavorite={handleFavoriteSelect} />
                        </motion.div>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onNavigateToSelection}
                            className={styles.ctaButton}>
                            Find your train
                        </motion.button>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={styles.features}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <Train className={styles.featureIconSvg} />
                        </div>
                        <h3 className={styles.featureTitle}>Real-time</h3>
                        <p className={styles.featureDescription}>Live train updates</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <MapPin className={styles.featureIconSvg} />
                        </div>
                        <h3 className={styles.featureTitle}>VVS Network</h3>
                        <p className={styles.featureDescription}>Stuttgart area coverage</p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
