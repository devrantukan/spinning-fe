"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "../../contexts/LanguageContext";
import { z } from "zod";
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
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [tokenVerified, setTokenVerified] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const { t } = useLanguage();
  const supabase = createClient();

  // Create validation schema with language-specific messages
  const resetPasswordSchema = useMemo(
    () =>
      z
        .object({
          password: z
            .string()
            .min(
              1,
              t("auth.validation.passwordRequired") || "Password is required"
            )
            .min(
              6,
              t("auth.resetPassword.passwordTooShort") ||
                "Password must be at least 6 characters"
            ),
          confirmPassword: z
            .string()
            .min(
              1,
              t("auth.validation.passwordRequired") || "Password is required"
            ),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message:
            t("auth.resetPassword.passwordMismatch") ||
            "Passwords do not match",
          path: ["confirmPassword"],
        }),
    [t]
  );

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (token_hash && type === "recovery") {
      setMode("reset");
      // Verify token once when page loads (don't verify again on submit)
      const verifyToken = async () => {
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: "recovery",
          });

          if (verifyError) {
            // Check if it's a token expiration error
            if (
              verifyError.message?.includes("expired") ||
              verifyError.message?.includes("invalid") ||
              verifyError.message?.includes("link")
            ) {
              setTokenError(
                t("auth.resetPassword.linkExpired") ||
                  "Email link is invalid or has expired. Please request a new password reset link."
              );
            } else {
              setTokenError(verifyError.message);
            }
          } else {
            setTokenVerified(true);
          }
        } catch (err: any) {
          setTokenError(
            err.message ||
              t("auth.resetPassword.linkExpired") ||
              "Email link is invalid or has expired."
          );
        }
      };

      verifyToken();
    }
  }, [searchParams, supabase.auth, t]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Generate password reset link using Admin API (doesn't send email)
      const linkResponse = await fetch(
        "/api/auth/generate-password-reset-link",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
          }),
        }
      );

      if (!linkResponse.ok) {
        const errorData = await linkResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to generate password reset link"
        );
      }

      const linkData = await linkResponse.json();

      if (!linkData?.resetToken) {
        throw new Error("Failed to get password reset token");
      }

      // Send password reset email using organization SMTP
      const emailResponse = await fetch("/api/auth/send-password-reset-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          name: null, // We don't have the name here, but it's optional
          resetToken: linkData.resetToken,
          language: t("language") || "en",
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({}));
        // Don't fail if email sending fails - the link was generated
        console.warn("Failed to send password reset email:", errorData);
      }

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
    setFieldErrors({});

    // Validate using Zod schema
    const validationResult = resetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setFieldErrors(errors);

      // Set first error as main error message
      const firstError = validationResult.error.issues[0];
      if (firstError) {
        setError(firstError.message);
      }

      setLoading(false);
      return;
    }

    // Check if token was verified on page load
    if (!tokenVerified) {
      if (tokenError) {
        setError(tokenError);
      } else {
        setError(
          t("auth.resetPassword.linkExpired") ||
            "Email link is invalid or has expired. Please request a new password reset link."
        );
      }
      setLoading(false);
      return;
    }

    try {
      // Token was already verified on page load, just update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        // Check if it's a "same password" error
        if (
          updateError.message?.includes("same") ||
          updateError.message?.includes("current") ||
          updateError.message?.includes("old")
        ) {
          setFieldErrors({
            password:
              t("auth.resetPassword.sameAsOld") ||
              "New password must be different from your current password",
          });
          setError(
            t("auth.resetPassword.sameAsOld") ||
              "New password must be different from your current password"
          );
          setLoading(false);
          return;
        }
        throw updateError;
      }

      setMessage(
        t("auth.resetPassword.success") ||
          "Password reset successfully! Redirecting..."
      );
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      // Check for specific error messages
      if (
        err.message?.includes("expired") ||
        err.message?.includes("invalid") ||
        err.message?.includes("link")
      ) {
        setError(
          t("auth.resetPassword.linkExpired") ||
            "Email link is invalid or has expired. Please request a new password reset link."
        );
      } else {
        setError(err.message || t("auth.error") || "An error occurred");
      }
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
                placeholder={
                  t("auth.emailPlaceholder") || "your.email@example.com"
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
                : t("auth.resetPassword.sendResetLink") || "Send Reset Link"}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: undefined,
                    }));
                  }
                  if (fieldErrors.confirmPassword && confirmPassword) {
                    // Re-validate confirm password when password changes
                    const result = resetPasswordSchema.safeParse({
                      password: e.target.value,
                      confirmPassword,
                    });
                    if (result.success) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                    }
                  }
                }}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  fieldErrors.password
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={t("auth.passwordPlaceholder") || "Your password"}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.resetPassword.confirmPassword") || "Confirm Password"}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                  }
                  // Re-validate when confirm password changes
                  if (password) {
                    const result = resetPasswordSchema.safeParse({
                      password,
                      confirmPassword: e.target.value,
                    });
                    if (!result.success) {
                      const confirmError = result.error.issues.find(
                        (issue) => issue.path[0] === "confirmPassword"
                      );
                      if (confirmError) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          confirmPassword: confirmError.message,
                        }));
                      }
                    }
                  }
                }}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  fieldErrors.confirmPassword
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={
                  t("auth.resetPassword.confirmPasswordPlaceholder") ||
                  "Confirm your password"
                }
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.confirmPassword}
                </p>
              )}
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
