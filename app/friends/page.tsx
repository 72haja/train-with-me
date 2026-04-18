"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AddFriendForm } from "@ui/molecules/add-friend-form";
import { Alert } from "@ui/molecules/alert";
import { FriendCard } from "@ui/molecules/friend-card";
import { FriendRequestList } from "@ui/molecules/friend-request-list";
import styles from "./page.module.scss";

const FriendsPage = () => {
    const router = useRouter();
    const friends = useQuery(api.friendships.list, {});
    const requests = useQuery(api.friendships.listRequests, {});
    const sendRequest = useMutation(api.friendships.sendRequest);
    const acceptRequest = useMutation(api.friendships.acceptRequest);
    const declineRequest = useMutation(api.friendships.declineRequest);
    const removeFriendship = useMutation(api.friendships.remove);
    const [requestLoading, setRequestLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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
            await sendRequest({ email: email.trim() });
            setSuccess("Friend request sent!");
            setEmail("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send friend request");
        } finally {
            setRequestLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        try {
            await acceptRequest({
                friendshipId: requestId as Id<"friendships">,
            });
            setSuccess("Friend request accepted!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to accept friend request");
        }
    };

    const handleDecline = async (requestId: string) => {
        try {
            await declineRequest({
                friendshipId: requestId as Id<"friendships">,
            });
            setSuccess("Friend request declined");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to decline friend request");
        }
    };

    const handleRemove = async (friendshipId: string) => {
        if (!confirm("Are you sure you want to remove this friend?")) {
            return;
        }

        try {
            await removeFriendship({
                friendshipId: friendshipId as Id<"friendships">,
            });
            setSuccess("Friend removed");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to remove friend");
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

    const friendsList = friends ?? [];
    const received = requests?.received ?? [];
    const sent = requests?.sent ?? [];
    const friendsLoading = friends === undefined;

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
                    title={`Friend Requests (${received.length})`}
                    requests={received.map(r => ({
                        id: r.id,
                        type: r.type,
                        user: {
                            id: r.user.id,
                            name: r.user.name,
                            avatarUrl: r.user.avatarUrl,
                            email: r.user.email,
                        },
                        createdAt: new Date(r.createdAt).toISOString(),
                    }))}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    getInitials={getInitials}
                    delay={0.1}
                />

                <FriendRequestList
                    title={`Sent Requests (${sent.length})`}
                    requests={sent.map(r => ({
                        id: r.id,
                        type: r.type,
                        user: {
                            id: r.user.id,
                            name: r.user.name,
                            avatarUrl: r.user.avatarUrl,
                            email: r.user.email,
                        },
                        createdAt: new Date(r.createdAt).toISOString(),
                    }))}
                    getInitials={getInitials}
                    delay={0.2}
                />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={styles.section}>
                    <h2 className={styles.sectionTitle}>My Friends ({friendsList.length})</h2>
                    {friendsLoading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : friendsList.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyText}>No friends yet</p>
                            <p className={styles.emptySubtext}>
                                Send a friend request to get started!
                            </p>
                        </div>
                    ) : (
                        <div className={styles.friendsList}>
                            {friendsList.map(friend => (
                                <div key={friend.friendshipId} className={styles.friendItem}>
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
};

export default FriendsPage;
