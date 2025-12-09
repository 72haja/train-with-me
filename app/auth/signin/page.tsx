"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Train } from "lucide-react";
import { motion } from "motion/react";
import { signIn } from "@/app/actions/auth";
import { Button } from "@ui/atoms/button";
import styles from "@ui/organisms/auth-screen.module.scss";

export default function SignInPage() {
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

            // Success - redirect to home page
            console.log("// Success - redirect to home page");
            router.push("/");
            // router.refresh();
        } catch (err) {
            // Handle unexpected errors
            setError(err instanceof Error ? err.message : "Sign in failed");
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.header}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <Train className={styles.logoIconSvg} />
                        </div>
                        <h1 className={styles.logoText}>VVS Together</h1>
                    </div>
                    <p className={styles.subtitle}>Sign in to coordinate with friends</p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="email" className={styles.label}>
                            <Mail className={styles.labelIcon} />
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className={styles.input}
                            placeholder="anna@example.com"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password" className={styles.label}>
                            <Lock className={styles.labelIcon} />
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

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

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={styles.footer}>
                    <p className={styles.footerText}>
                        VVS Together is for private friend groups only.
                        <br />
                        Not intended for collecting PII or securing sensitive data.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
