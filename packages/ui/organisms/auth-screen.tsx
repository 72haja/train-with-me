"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Train, Mail, Lock, User } from "lucide-react"
import { Button } from "@ui/atoms/button"
import styles from './auth-screen.module.scss'

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, fullName: string) => Promise<void>;
  error: Error | null;
  loading: boolean;
}

export function AuthScreen({ onSignIn, onSignUp, error, loading }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signin') {
      await onSignIn(email, password);
    } else {
      await onSignUp(email, password, fullName);
      
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
            {mode === 'signin' 
              ? 'Sign in to coordinate with friends'
              : 'Create an account to get started'
            }
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className={styles.form}
        >
          {mode === 'signup' && (
            <div className={styles.field}>
              <label htmlFor="fullName" className={styles.label}>
                <User className={styles.labelIcon} />
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={styles.input}
                placeholder="Anna Schmidt"
                required
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              <Mail className={styles.labelIcon} />
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className={styles.error}>
              {error.message}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>

          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className={styles.toggleButton}
          >
            {mode === 'signin' 
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'
            }
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
