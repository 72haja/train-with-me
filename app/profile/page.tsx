"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateEmail, updatePassword, updateProfile } from "@/app/actions/profile";
import { useSession } from "@apis/hooks/useSession";
import { getSupabaseClient } from "@apis/supabase/client";
import { Alert } from "@ui/molecules/alert";
import { AvatarUploadSection } from "@ui/molecules/avatar-upload-section";
import { EmailFormSection } from "@ui/molecules/email-form-section";
import { PasswordFormSection } from "@ui/molecules/password-form-section";
import { ProfileFormSection } from "@ui/molecules/profile-form-section";
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
              .map(n => n[0])
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
                        aria-label="Go back">
                        <ArrowLeft className={styles.backButtonIcon} />
                    </button>
                    <h1 className={styles.headerTitle}>Profile</h1>
                </div>
            </header>

            <main className={styles.main}>
                {error && <Alert message={error} type="error" />}

                {success && <Alert message={success} type="success" />}

                <AvatarUploadSection
                    avatarUrl={avatarUrl}
                    userInitials={userInitials}
                    uploading={uploadingAvatar}
                    onUpload={handleAvatarUpload}
                />

                <ProfileFormSection
                    fullName={fullName}
                    onFullNameChange={setFullName}
                    onSubmit={handleProfileUpdate}
                    loading={loading}
                />

                <EmailFormSection
                    email={email}
                    onEmailChange={setEmail}
                    onSubmit={handleEmailUpdate}
                    loading={loading}
                />

                <PasswordFormSection
                    password={password}
                    confirmPassword={confirmPassword}
                    onPasswordChange={setPassword}
                    onConfirmPasswordChange={setConfirmPassword}
                    onSubmit={handlePasswordUpdate}
                    loading={loading}
                />
            </main>
        </div>
    );
}
