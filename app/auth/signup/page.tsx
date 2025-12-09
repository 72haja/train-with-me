'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Train, Mail, User } from 'lucide-react';
import { Button } from '@/packages/ui/atoms/button';
import { PasswordInput } from '@/packages/ui/molecules/password-input';
import { signUp } from '@/app/actions/auth';
import styles from '@/packages/ui/organisms/auth-screen.module.scss';

export default function SignUpPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(decodeURIComponent(errorParam));
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('fullName', fullName);

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
        <div className={styles.container}>
            <div className={styles.content}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.header}
                >
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <Train className={styles.logoIconSvg} />
                        </div>
                        <h1 className={styles.logoText}>VVS Together</h1>
                    </div>
                    <p className={styles.subtitle}>
                        Create an account to get started
                    </p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className={styles.form}
                >
                    <div className={styles.field}>
                        <label htmlFor="fullName" className={styles.label}>
                            <User className={styles.labelIcon} />
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={styles.input}
                            placeholder="Anna Schmidt"
                            required
                        />
                    </div>

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
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            placeholder="anna@example.com"
                            required
                        />
                    </div>

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

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={loading}
                    >
                        Create Account
                    </Button>

                    <button
                        type="button"
                        onClick={() => router.push('/auth/signin')}
                        className={styles.toggleButton}
                    >
                        Already have an account? Sign in
                    </button>
                </motion.form>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={styles.footer}
                >
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

