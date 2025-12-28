"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, User } from "lucide-react";
import { motion } from "motion/react";
import { signUp } from "@/app/actions/auth";
import { Button } from "@ui/atoms/button";
import { Alert } from "@ui/molecules/alert";
import { AuthFooter } from "@ui/molecules/auth-footer";
import { AuthFormField } from "@ui/molecules/auth-form-field";
import { AuthHeader } from "@ui/molecules/auth-header";
import { PasswordInput } from "@ui/molecules/password-input";
import styles from "@ui/organisms/auth-screen.module.scss";

export function SignUpForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
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
        formData.append("fullName", fullName);

        try {
            const result = await signUp(formData);

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
            setError(err instanceof Error ? err.message : "Sign up failed");
            setLoading(false);
        }
    };

    return (
        <>
            <AuthHeader subtitle="Create an account to get started" />

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSubmit}
                className={styles.form}>
                <AuthFormField
                    label="Full Name"
                    labelIcon={<User className={styles.labelIcon} />}
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Anna Schmidt"
                    required
                />

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

                <div className={styles.field}>
                    <PasswordInput
                        id="password"
                        name="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="••••••••"
                        label="Password"
                        required
                        minLength={8}
                        showStrength={true}
                    />
                </div>

                {error && <Alert message={error} type="error" />}

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                    Create Account
                </Button>

                <button
                    type="button"
                    onClick={() => router.push("/auth/signin")}
                    className={styles.toggleButton}>
                    Already have an account? Sign in
                </button>
            </motion.form>

            <AuthFooter />
        </>
    );
}
