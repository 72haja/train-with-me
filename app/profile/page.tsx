"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, User, Mail, Upload, X } from "lucide-react";
import { useSession } from "@apis/hooks/useSession";
import { getSupabaseClient } from "@apis/supabase/client";
import { Button } from "@ui/atoms/button";
import { Input } from "@ui/atoms/input";
import { PasswordInput } from "@ui/molecules/password-input";
import { updateEmail, updatePassword, updateProfile } from "@/app/actions/profile";
import Image from "next/image";
import styles from "./page.module.scss";

export default function ProfilePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        const errorParam = searchParams.get("error");
        const successParam = searchParams.get("success");
        if (errorParam) {
            setError(decodeURIComponent(errorParam));
        }
        if (successParam) {
            setSuccess(decodeURIComponent(successParam));
        }
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || "");
            setEmail(user.email || "");
            setAvatarUrl(user.user_metadata?.avatar_url || null);
        }
    }, [user]);

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append("email", email);

        try {
            await updateEmail(formData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update email");
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("password", password);
        formData.append("confirmPassword", confirmPassword);

        try {
            await updatePassword(formData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update password");
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append("fullName", fullName);
        if (avatarUrl) {
            formData.append("avatarUrl", avatarUrl);
        }

        try {
            await updateProfile(formData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile");
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();

            // Validate file type
            if (!file.type.startsWith("image/")) {
                throw new Error("File must be an image");
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error("File size must be less than 5MB");
            }

            // Create file path
            const fileExt = file.name.split(".").pop();
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
            const filePath = `${user?.id}/${fileName}`;

            // Upload directly to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const {
                data: { publicUrl },
            } = supabase.storage.from("avatars").getPublicUrl(filePath);

            // Update user metadata and profile
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    avatar_url: publicUrl,
                },
            });

            if (updateError) {
                console.error("Error updating user metadata:", updateError);
            }

            // Update profile table
            await supabase.from("profiles").upsert(
                {
                    id: user?.id,
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "id",
                }
            );

            setAvatarUrl(publicUrl);
            setSuccess("Avatar uploaded successfully");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload avatar");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const userInitials = fullName
        ? fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2)
        : email
          ? email.substring(0, 2).toUpperCase()
          : "U";

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <button
                        onClick={() => router.back()}
                        className={styles.backButton}
                        aria-label="Go back"
                    >
                        <ArrowLeft className={styles.backButtonIcon} />
                    </button>
                    <h1 className={styles.headerTitle}>Profile</h1>
                </div>
            </header>

            <main className={styles.main}>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={styles.alert}
                        style={{ backgroundColor: "rgba(220, 40, 30, 0.1)", borderColor: "rgba(220, 40, 30, 0.2)", color: "var(--color-error)" }}
                    >
                        {error}
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={styles.alert}
                        style={{ backgroundColor: "rgba(0, 152, 95, 0.1)", borderColor: "rgba(0, 152, 95, 0.2)", color: "var(--color-success)" }}
                    >
                        {success}
                    </motion.div>
                )}

                {/* Profile Picture Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.section}
                >
                    <h2 className={styles.sectionTitle}>Profile Picture</h2>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt={fullName || "Profile"}
                                    width={120}
                                    height={120}
                                    className={styles.avatarImage}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {userInitials}
                                </div>
                            )}
                        </div>
                        <label className={styles.uploadButton}>
                            <Upload className={styles.uploadIcon} />
                            {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={uploadingAvatar}
                                className={styles.fileInput}
                            />
                        </label>
                    </div>
                </motion.div>

                {/* Profile Information */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleProfileUpdate}
                    className={styles.section}
                >
                    <h2 className={styles.sectionTitle}>Profile Information</h2>
                    <div className={styles.field}>
                        <label htmlFor="fullName" className={styles.label}>
                            <User className={styles.labelIcon} />
                            Full Name
                        </label>
                        <Input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your name"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        fullWidth
                        loading={loading}
                    >
                        Update Profile
                    </Button>
                </motion.form>

                {/* Email Section */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleEmailUpdate}
                    className={styles.section}
                >
                    <h2 className={styles.sectionTitle}>Email</h2>
                    <div className={styles.field}>
                        <label htmlFor="email" className={styles.label}>
                            <Mail className={styles.labelIcon} />
                            Email Address
                        </label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        variant="secondary"
                        size="md"
                        fullWidth
                        loading={loading}
                    >
                        Update Email
                    </Button>
                </motion.form>

                {/* Password Section */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onSubmit={handlePasswordUpdate}
                    className={styles.section}
                >
                    <h2 className={styles.sectionTitle}>Password</h2>
                    <div className={styles.field}>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={password}
                            onChange={setPassword}
                            placeholder="••••••••"
                            label="New Password"
                            required
                            minLength={8}
                            showStrength={true}
                        />
                    </div>
                    <div className={styles.field}>
                        <PasswordInput
                            id="confirmPassword"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="••••••••"
                            label="Confirm Password"
                            required
                            minLength={8}
                            showStrength={false}
                        />
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                        <div className={styles.errorMessage}>
                            Passwords do not match
                        </div>
                    )}
                    <Button
                        type="submit"
                        variant="secondary"
                        size="md"
                        fullWidth
                        loading={loading}
                    >
                        Update Password
                    </Button>
                </motion.form>
            </main>
        </div>
    );
}

