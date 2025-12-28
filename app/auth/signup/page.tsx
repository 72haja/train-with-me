"use client";

import { Suspense } from "react";
import { SignUpForm } from "@/app/components/sign-up-form";
import styles from "@ui/organisms/auth-screen.module.scss";

export default function SignUpPage() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Suspense fallback={<div>Loading...</div>}>
                    <SignUpForm />
                </Suspense>
            </div>
        </div>
    );
}
