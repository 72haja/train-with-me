"use client";

import { Suspense } from "react";
import { ProfileContent } from "@/app/components/profile-content";
import styles from "./page.module.scss";

export default function ProfilePage() {
    return (
        <div className={styles.container}>
            <Suspense fallback={<div>Loading...</div>}>
                <ProfileContent />
            </Suspense>
        </div>
    );
}
