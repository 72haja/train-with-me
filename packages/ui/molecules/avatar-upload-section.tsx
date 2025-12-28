"use client";

import Image from "next/image";
import { Upload } from "lucide-react";
import { motion } from "motion/react";
import styles from "./avatar-upload-section.module.scss";

interface AvatarUploadSectionProps {
    avatarUrl: string | null;
    userInitials: string;
    uploading: boolean;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AvatarUploadSection({
    avatarUrl,
    userInitials,
    uploading,
    onUpload,
}: AvatarUploadSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile Picture</h2>
            <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt="Profile"
                            width={120}
                            height={120}
                            className={styles.avatarImage}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>{userInitials}</div>
                    )}
                </div>
                <label className={styles.uploadButton}>
                    <Upload className={styles.uploadIcon} />
                    {uploading ? "Uploading..." : "Upload Photo"}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={onUpload}
                        disabled={uploading}
                        className={styles.fileInput}
                    />
                </label>
            </div>
        </motion.div>
    );
}
