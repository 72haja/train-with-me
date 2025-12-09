"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@apis/hooks/useAuth";
import styles from "./user-menu.module.scss";

export function UserMenu() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        router.push("/auth/signin");
    };

    const handleProfileClick = () => {
        setIsOpen(false);
        router.push("/profile");
    };

    const handleFriendsClick = () => {
        setIsOpen(false);
        router.push("/friends");
    };

    const userInitials = user?.email?.split("@")[0].substring(0, 2).toUpperCase() || "U";

    return (
        <div className={styles.menuContainer} ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={styles.trigger}
                aria-label="User menu">
                <div className={styles.avatar}>
                    {user?.user_metadata?.avatar_url ? (
                        <Image
                            src={user.user_metadata.avatar_url}
                            alt={user.email || "User"}
                            width={32}
                            height={32}
                            className={styles.avatarImage}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>{userInitials}</div>
                    )}
                </div>
                <ChevronDown className={styles.chevron} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={styles.menu}>
                        <div className={styles.menuHeader}>
                            <div className={styles.menuAvatar}>
                                {user?.user_metadata?.avatar_url ? (
                                    <Image
                                        src={user.user_metadata.avatar_url}
                                        alt={user.email || "User"}
                                        width={48}
                                        height={48}
                                        className={styles.menuAvatarImage}
                                    />
                                ) : (
                                    <div className={styles.menuAvatarPlaceholder}>
                                        {userInitials}
                                    </div>
                                )}
                            </div>
                            <div className={styles.menuUserInfo}>
                                <p className={styles.menuUserName}>
                                    {user?.user_metadata?.full_name || "User"}
                                </p>
                                <p className={styles.menuUserEmail}>{user?.email}</p>
                            </div>
                        </div>

                        <div className={styles.menuDivider} />

                        <button
                            type="button"
                            onClick={handleProfileClick}
                            className={styles.menuItem}>
                            <User className={styles.menuItemIcon} />
                            <span>Profile</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleFriendsClick}
                            className={styles.menuItem}>
                            <Users className={styles.menuItemIcon} />
                            <span>Friends</span>
                        </button>

                        <button type="button" onClick={handleSignOut} className={styles.menuItem}>
                            <LogOut className={styles.menuItemIcon} />
                            <span>Sign out</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
