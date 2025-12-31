"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<
    "loading" | "setPassword" | "success" | "error"
  >("loading");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const { refreshSession } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const handleActivation = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (token_hash) {
        try {
          // Verify the token - use 'email' type for email confirmations (signup type is deprecated)
          // The type parameter from URL might be 'signup', but we use 'email' for verification
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: "email", // Always use 'email' type for email confirmations
          });

          if (verifyError) {
            console.error("Token verification error:", verifyError);
            setStatus("error");
            setMessage(
              verifyError.message ||
                t("auth.activate.error") ||
                "Activation failed. The link may have expired."
            );
          } else {
            // Token verified successfully, show password set form
            setStatus("setPassword");
            setMessage(
              t("auth.activate.setPasswordMessage") ||
                "Please create a password for your account."
            );
          }
        } catch (err: any) {
          console.error("Activation error:", err);
          setStatus("error");
          setMessage(
            err.message ||
              t("auth.activate.error") ||
              "An error occurred during activation."
          );
        }
      } else {
        setStatus("error");
        setMessage(
          t("auth.activate.invalidLink") || "Invalid activation link."
        );
      }
    };

    handleActivation();
  }, [searchParams, supabase.auth, t]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setError(null);
    setMessage("");

    if (password !== confirmPassword) {
      setError(
        t("auth.resetPassword.passwordMismatch") || "Passwords do not match"
      );
      setPasswordLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(
        t("auth.resetPassword.passwordTooShort") ||
          "Password must be at least 6 characters"
      );
      setPasswordLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setStatus("success");
      setMessage(
        t("auth.activate.success") ||
          "Password created successfully! Redirecting..."
      );

      // Refresh session and redirect to dashboard
      await refreshSession();
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(
        err.message ||
          t("auth.activate.passwordError") ||
          "Failed to set password. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center pt-20 px-4">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero_background_cycling_studio.png"
          alt="Studio Atmosphere"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 hero-overlay-base z-10 transition-colors duration-500" />
        <div className="absolute inset-0 hero-overlay-gradient z-10 transition-colors duration-500" />
      </div>

      <div className="relative z-20 max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t("auth.activate.activating") || "Activating Account..."}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("auth.activate.pleaseWait") ||
                "Please wait while we activate your account."}
            </p>
          </>
        )}

        {status === "setPassword" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t("auth.activate.setPasswordTitle") || "Create Your Password"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <form onSubmit={handleSetPassword} className="space-y-4 text-left">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {t("auth.resetPassword.newPassword") || "New Password"}
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={
                    t("auth.resetPassword.newPasswordPlaceholder") ||
                    "Enter your password"
                  }
                  required
                  minLength={6}
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
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={
                    t("auth.resetPassword.confirmPasswordPlaceholder") ||
                    "Confirm your password"
                  }
                  required
                  minLength={6}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading
                  ? t("auth.activate.settingPassword") || "Setting Password..."
                  : t("auth.activate.setPassword") || "Set Password"}
              </button>
            </form>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-green-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t("auth.activate.successTitle") || "Password Set Successfully!"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
            >
              {t("auth.activate.goToDashboard") || "Go to Dashboard"}
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-red-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t("auth.activate.errorTitle") || "Activation Failed"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/"
                className="block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
              >
                {t("auth.activate.goHome") || "Go to Home"}
              </Link>
              <Link
                href="/auth/reset-password"
                className="block text-orange-500 hover:text-orange-600 dark:text-orange-400"
              >
                {t("auth.activate.requestNewLink") ||
                  "Request a new activation link"}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ActivatePage() {
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
      <ActivateContent />
    </Suspense>
  );
}
