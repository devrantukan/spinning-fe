"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";

function AcceptInvitationContent() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "setPassword" | "success" | "error"
  >("loading");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptToc, setAcceptToc] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { t } = useLanguage();
  const { refreshSession } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const handleInvitation = async () => {
      try {
        // Extract tokens from URL hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const expires_at = params.get("expires_at");
        const token_type = params.get("token_type");
        const type = params.get("type");

        if (!access_token || !refresh_token || type !== "invite") {
          setStatus("error");
          setMessage(
            t("auth.invitation.invalidLink") ||
              "Invalid invitation link. Please check your email for a valid invitation."
          );
          return;
        }

        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          setStatus("error");
          setMessage(
            t("auth.invitation.error") ||
              "Failed to accept invitation. The link may have expired."
          );
          return;
        }

        // Refresh the session in the auth context
        await refreshSession();

        // Show password creation form
        setStatus("setPassword");
        setMessage(
          t("auth.invitation.setPasswordMessage") ||
            "Please create a password for your account."
        );
      } catch (err: any) {
        setStatus("error");
        setMessage(
          err.message ||
            t("auth.invitation.error") ||
            "An error occurred while accepting the invitation."
        );
      }
    };

    handleInvitation();
  }, [router, supabase.auth, t, refreshSession]);

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

    if (!acceptToc) {
      setError(
        t("auth.invitation.tocRequired") ||
          "You must accept the Terms and Conditions to continue"
      );
      setPasswordLoading(false);
      return;
    }

    try {
      const { data: userData, error: updateError } =
        await supabase.auth.updateUser({
          password: password,
        });

      if (updateError) throw updateError;

      // Save TOC acceptance to database
      if (userData.user) {
        try {
          const response = await fetch("/api/users/toc", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              supabaseUserId: userData.user.id,
              accepted: true,
            }),
          });

          if (!response.ok) {
            console.error("Failed to save TOC acceptance");
          }
        } catch (err) {
          console.error("Error saving TOC acceptance:", err);
        }
      }

      setStatus("success");
      setMessage(
        t("auth.invitation.success") ||
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
          t("auth.invitation.passwordError") ||
          "Failed to set password. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 pt-20 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t("auth.invitation.accepting") || "Accepting Invitation..."}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("auth.invitation.pleaseWait") ||
                "Please wait while we process your invitation."}
            </p>
          </>
        )}

        {status === "setPassword" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t("auth.invitation.setPasswordTitle") || "Create Your Password"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSetPassword} className="space-y-4 text-left">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {t("auth.password") || "Password"}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
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
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={
                    t("auth.resetPassword.confirmPasswordPlaceholder") ||
                    "Confirm your password"
                  }
                />
              </div>

              <div className="flex items-start">
                <input
                  id="acceptToc"
                  type="checkbox"
                  checked={acceptToc}
                  onChange={(e) => {
                    setAcceptToc(e.target.checked);
                    if (error) setError(null);
                  }}
                  required
                  className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="acceptToc"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  {t("auth.invitation.acceptToc") ||
                    "I accept the Terms and Conditions"}
                </label>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading
                  ? t("auth.loading") || "Loading..."
                  : t("auth.invitation.createPassword") || "Create Password"}
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
              {t("auth.invitation.successTitle") || "Invitation Accepted!"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
            >
              {t("auth.invitation.goToDashboard") || "Go to Dashboard"}
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
              {t("auth.invitation.errorTitle") || "Invitation Failed"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/"
                className="block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
              >
                {t("auth.invitation.goHome") || "Go to Home"}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
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
      <AcceptInvitationContent />
    </Suspense>
  );
}
