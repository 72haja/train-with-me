"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import styles from "@/app/profile/page.module.scss";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@apis/hooks/useSession";
import { Alert } from "@ui/molecules/alert";
import { AvatarUploadSection } from "@ui/molecules/avatar-upload-section";
import { ProfileFormSection } from "@ui/molecules/profile-form-section";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export const ProfileContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useSession();
    const updateProfile = useMutation(api.users.updateProfile);
    const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
    const setAvatar = useMutation(api.users.setAvatar);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [fullName, setFullName] = useState("");
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
            setFullName(user.fullName ?? "");
        }
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await updateProfile({ fullName });
            setSuccess("Profile updated");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        setUploadingAvatar(true);
        setError(null);

        try {
            if (!file.type.startsWith("image/")) {
                throw new Error("File must be an image");
            }

            if (file.size > MAX_AVATAR_BYTES) {
                throw new Error("File size must be less than 5MB");
            }

            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) {
                throw new Error("Upload failed");
            }

            const { storageId } = (await result.json()) as {
                storageId: Id<"_storage">;
            };

            await setAvatar({ storageId });
            setSuccess("Avatar uploaded successfully");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload avatar");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const email = user?.email ?? "";

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
        <>
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
                    avatarUrl={user?.avatarUrl ?? null}
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
            </main>
        </>
    );
};
