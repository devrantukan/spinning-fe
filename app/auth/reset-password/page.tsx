"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "../../contexts/LanguageContext";
import Link from "next/link";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"request" | "reset">("request");
  const { t } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (token_hash && type === "recovery") {
      setMode("reset");
    }
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setMessage(
        t("auth.resetPassword.emailSent") ||
          "Password reset email sent! Please check your inbox."
      );
    } catch (err: any) {
      setError(err.message || t("auth.error") || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError(
        t("auth.resetPassword.passwordMismatch") ||
          "Passwords do not match"
      );
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(
        t("auth.resetPassword.passwordTooShort") ||
          "Password must be at least 6 characters"
      );
      setLoading(false);
      return;
    }

    try {
      const token_hash = searchParams.get("token_hash");
      if (token_hash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "recovery",
        });

        if (error) throw error;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setMessage(
        t("auth.resetPassword.success") ||
          "Password reset successfully! Redirecting..."
      );
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || t("auth.error") || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 pt-20 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          {mode === "request"
            ? t("auth.resetPassword.title") || "Reset Password"
            : t("auth.resetPassword.setNewPassword") || "Set New Password"}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-400 rounded">
            {message}
          </div>
        )}

        {mode === "request" ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.email") || "Email"}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={t("auth.emailPlaceholder") || "your.email@example.com"}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t("auth.loading") || "Loading..."
                : t("auth.resetPassword.sendResetLink") ||
                  "Send Reset Link"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.resetPassword.newPassword") || "New Password"}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={t("auth.passwordPlaceholder") || "Your password"}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.resetPassword.confirmPassword") ||
                  "Confirm Password"}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={
                  t("auth.resetPassword.confirmPasswordPlaceholder") ||
                  "Confirm your password"
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t("auth.loading") || "Loading..."
                : t("auth.resetPassword.resetPassword") || "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400"
          >
            {t("auth.resetPassword.backToHome") || "Back to Home"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 pt-20 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

