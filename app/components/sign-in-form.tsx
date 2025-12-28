"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { motion } from "motion/react";
import { signIn } from "@/app/actions/auth";
import { Button } from "@ui/atoms/button";
import { Alert } from "@ui/molecules/alert";
import { AuthFooter } from "@ui/molecules/auth-footer";
import { AuthFormField } from "@ui/molecules/auth-form-field";
import { AuthHeader } from "@ui/molecules/auth-header";
import styles from "@ui/organisms/auth-screen.module.scss";

export function SignInForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (errorParam) {
            setError(decodeURIComponent(errorParam));
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);

        try {
            const result = await signIn(formData);

            if (result?.error) {
                setError(result.error);
                setLoading(false);
                return;
            }

            // Success - session is stored in cookies by server action
            // Redirect to home page
            router.push("/");
            router.refresh();
        } catch (err) {
            // Handle unexpected errors
            setError(err instanceof Error ? err.message : "Sign in failed");
            setLoading(false);
        }
    };

    return (
        <>
            <AuthHeader subtitle="Sign in to coordinate with friends" />

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSubmit}
                className={styles.form}>
                <AuthFormField
                    label="Email"
                    labelIcon={<Mail className={styles.labelIcon} />}
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="anna@example.com"
                    required
                />

                <AuthFormField
                    label="Password"
                    labelIcon={<Lock className={styles.labelIcon} />}
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                />

                {error && <Alert message={error} type="error" />}

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                    Sign In
                </Button>

                <button
                    type="button"
                    onClick={() => router.push("/auth/signup")}
                    className={styles.toggleButton}>
                    Do not have an account? Sign up
                </button>
            </motion.form>

            <AuthFooter />
        </>
    );
}

