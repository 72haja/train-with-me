"use client";

import { Suspense } from "react";
import { SignInForm } from "@/app/components/sign-in-form";
import styles from "@ui/organisms/auth-screen.module.scss";

export default function SignInPage() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Suspense fallback={<div>Loading...</div>}>
                    <SignInForm />
                </Suspense>
            </div>
        </div>
    );
}
