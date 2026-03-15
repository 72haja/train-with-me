"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import useSWR from "swr";
import type { FriendRequest, FriendWithFriendshipId } from "@/packages/types/lib/types";
import { AddFriendForm } from "@ui/molecules/add-friend-form";
import { Alert } from "@ui/molecules/alert";
import { FriendCard } from "@ui/molecules/friend-card";
import { FriendRequestList } from "@ui/molecules/friend-request-list";
import styles from "./page.module.scss";

async function fetchFriends(): Promise<FriendWithFriendshipId[]> {
    const response = await fetch("/api/friends");
    const data = await response.json();
    if (response.ok && data.success) return data.data;
    return [];
}

async function fetchRequests(): Promise<{ received: FriendRequest[]; sent: FriendRequest[] }> {
    const response = await fetch("/api/friends/requests");
    const data = await response.json();
    if (response.ok && data.success) return data.data;
    return { received: [], sent: [] };
}

export default function FriendsPage() {
    const router = useRouter();
    const [requestLoading, setRequestLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const {
        data: friends = [],
        isLoading: friendsLoading,
        mutate: mutateFriends,
    } = useSWR("/api/friends", fetchFriends);

    const {
        data: requests = { received: [], sent: [] },
        mutate: mutateRequests,
    } = useSWR("/api/friends/requests", fetchRequests);

    // Auto-dismiss alerts after 10 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const validateEmail = (emailValue: string): string | null => {
        if (!emailValue || emailValue.trim() === "") {
            return "Email address is required";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue.trim())) {
            return "Please enter a valid email address";
        }

        return null;
    };

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setRequestLoading(true);

        try {
            const response = await fetch("/api/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess("Friend request sent!");
                setEmail("");
                mutateRequests();
            } else {
                setError(data.error || "Failed to send friend request");
            }
        } catch {
            setError("Failed to send friend request");
        } finally {
            setRequestLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        try {
            const response = await fetch(`/api/friends/${requestId}/accept`, {
                method: "POST",
            });

            if (response.ok) {
                mutateFriends();
                mutateRequests();
                setSuccess("Friend request accepted!");
            } else {
                setError("Failed to accept friend request");
            }
        } catch {
            setError("Failed to accept friend request");
        }
    };

    const handleDecline = async (requestId: string) => {
        try {
            const response = await fetch(`/api/friends/${requestId}/decline`, {
                method: "POST",
            });

            if (response.ok) {
                mutateRequests();
                setSuccess("Friend request declined");
            } else {
                setError("Failed to decline friend request");
            }
        } catch {
            setError("Failed to decline friend request");
        }
    };

    const handleRemove = async (friendshipId: string) => {
        if (!confirm("Are you sure you want to remove this friend?")) {
            return;
        }

        try {
            const response = await fetch(`/api/friends/${friendshipId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                mutateFriends();
                setSuccess("Friend removed");
            } else {
                setError("Failed to remove friend");
            }
        } catch {
            setError("Failed to remove friend");
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <button
                        onClick={() => router.back()}
                        className={styles.backButton}
                        aria-label="Go back">
                        <ArrowLeft className={styles.backButtonIcon} />
                    </button>
                    <h1 className={styles.headerTitle}>Friends</h1>
                </div>
            </header>

            <main className={styles.main}>
                {error && <Alert message={error} type="error" onDismiss={() => setError(null)} />}

                {success && <Alert message={success} type="success" />}

                <AddFriendForm
                    email={email}
                    onEmailChange={setEmail}
                    onSubmit={handleSendRequest}
                    loading={requestLoading}
                    onEmailChangeClearError={() => setError(null)}
                />

                <FriendRequestList
                    title={`Friend Requests (${requests.received.length})`}
                    requests={requests.received}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    getInitials={getInitials}
                    delay={0.1}
                />

                <FriendRequestList
                    title={`Sent Requests (${requests.sent.length})`}
                    requests={requests.sent}
                    getInitials={getInitials}
                    delay={0.2}
                />

                {/* Friends List Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={styles.section}>
                    <h2 className={styles.sectionTitle}>My Friends ({friends.length})</h2>
                    {friendsLoading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : friends.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyText}>No friends yet</p>
                            <p className={styles.emptySubtext}>
                                Send a friend request to get started!
                            </p>
                        </div>
                    ) : (
                        <div className={styles.friendsList}>
                            {friends.map(friend => (
                                <div key={friend.id} className={styles.friendItem}>
                                    <FriendCard
                                        friend={{
                                            id: friend.id,
                                            name: friend.name,
                                            avatarUrl: friend.avatarUrl || undefined,
                                            isOnline: false,
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(friend.friendshipId)}
                                        className={styles.removeButton}
                                        aria-label="Remove friend">
                                        <Trash2 className={styles.removeIcon} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
