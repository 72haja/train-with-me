"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Mail, Trash2, UserPlus, X } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@ui/atoms/button";
import { Input } from "@ui/atoms/input";
import { FriendCard } from "@ui/molecules/friend-card";
import styles from "./page.module.scss";

interface Friend {
    id: string;
    name: string;
    avatarUrl: string | null;
    friendshipId: string;
}

interface FriendRequest {
    id: string;
    type: "received" | "sent";
    user: {
        id: string;
        name: string;
        avatarUrl: string | null;
        email: string;
    };
    createdAt: string;
}

export default function FriendsPage() {
    const router = useRouter();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<{ received: FriendRequest[]; sent: FriendRequest[] }>({
        received: [],
        sent: [],
    });
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadFriends();
        loadRequests();
    }, []);

    // Auto-dismiss alerts after 10 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 10000); // 10 seconds

            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const loadFriends = async () => {
        try {
            const response = await fetch("/api/friends");
            const data = await response.json();

            if (response.ok && data.success) {
                setFriends(data.data);
            }
        } catch (err) {
            console.error("Error loading friends:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadRequests = async () => {
        try {
            const response = await fetch("/api/friends/requests");
            const data = await response.json();

            if (response.ok && data.success) {
                setRequests(data.data);
            }
        } catch (err) {
            console.error("Error loading requests:", err);
        }
    };

    const validateEmail = (email: string): string | null => {
        if (!email || email.trim() === "") {
            return "Email address is required";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return "Please enter a valid email address";
        }

        return null;
    };

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validate email before submitting
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setRequestLoading(true);

        try {
            const response = await fetch("/api/friends/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess("Friend request sent!");
                setEmail("");
                loadRequests();
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
                loadFriends();
                loadRequests();
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
                loadRequests();
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
                loadFriends();
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
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={styles.alert}
                        style={{
                            backgroundColor: "rgba(220, 40, 30, 0.1)",
                            borderColor: "rgba(220, 40, 30, 0.2)",
                            color: "var(--color-error)",
                        }}>
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className={styles.closeInfoBoxButton}>
                            <X />
                        </button>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={styles.alert}
                        style={{
                            backgroundColor: "rgba(0, 152, 95, 0.1)",
                            borderColor: "rgba(0, 152, 95, 0.2)",
                            color: "var(--color-success)",
                        }}>
                        {success}
                    </motion.div>
                )}

                {/* Add Friend Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.section}>
                    <h2 className={styles.sectionTitle}>Add Friend</h2>
                    <form onSubmit={handleSendRequest} className={styles.addFriendForm} noValidate>
                        <div className={styles.field}>
                            <label htmlFor="email" className={styles.label}>
                                <Mail className={styles.labelIcon} />
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => {
                                    setEmail(e.target.value);
                                    // Clear error when user starts typing
                                    if (error) {
                                        setError(null);
                                    }
                                }}
                                placeholder="friend@example.com"
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            fullWidth
                            loading={requestLoading}>
                            <UserPlus className={styles.buttonIcon} />
                            Send Friend Request
                        </Button>
                    </form>
                </motion.div>

                {/* Friend Requests Section */}
                {requests.received.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            Friend Requests ({requests.received.length})
                        </h2>
                        <div className={styles.requestsList}>
                            {requests.received.map(request => (
                                <div key={request.id} className={styles.requestCard}>
                                    <div className={styles.requestUser}>
                                        <div className={styles.requestAvatar}>
                                            {request.user.avatarUrl ? (
                                                <Image
                                                    src={request.user.avatarUrl}
                                                    alt={request.user.name}
                                                    width={48}
                                                    height={48}
                                                    className={styles.requestAvatarImage}
                                                />
                                            ) : (
                                                <div className={styles.requestAvatarPlaceholder}>
                                                    {getInitials(request.user.name)}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.requestInfo}>
                                            <p className={styles.requestName}>
                                                {request.user.name}
                                            </p>
                                            <p className={styles.requestEmail}>
                                                {request.user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={styles.requestActions}>
                                        <button
                                            type="button"
                                            onClick={() => handleAccept(request.id)}
                                            className={styles.acceptButton}
                                            aria-label="Accept">
                                            <Check className={styles.actionIcon} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDecline(request.id)}
                                            className={styles.declineButton}
                                            aria-label="Decline">
                                            <X className={styles.actionIcon} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Sent Requests Section */}
                {requests.sent.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            Sent Requests ({requests.sent.length})
                        </h2>
                        <div className={styles.requestsList}>
                            {requests.sent.map(request => (
                                <div key={request.id} className={styles.requestCard}>
                                    <div className={styles.requestUser}>
                                        <div className={styles.requestAvatar}>
                                            {request.user.avatarUrl ? (
                                                <Image
                                                    src={request.user.avatarUrl}
                                                    alt={request.user.name}
                                                    width={48}
                                                    height={48}
                                                    className={styles.requestAvatarImage}
                                                />
                                            ) : (
                                                <div className={styles.requestAvatarPlaceholder}>
                                                    {getInitials(request.user.name)}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.requestInfo}>
                                            <p className={styles.requestName}>
                                                {request.user.name}
                                            </p>
                                            <p className={styles.requestEmail}>
                                                {request.user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={styles.requestStatus}>
                                        <span className={styles.pendingBadge}>Pending</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Friends List Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={styles.section}>
                    <h2 className={styles.sectionTitle}>My Friends ({friends.length})</h2>
                    {loading ? (
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
