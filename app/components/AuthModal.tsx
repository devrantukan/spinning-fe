"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectAfterLogin?: boolean | string; // true/false or specific route
}

export default function AuthModal({
  isOpen,
  onClose,
  redirectAfterLogin = true,
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [acceptToc, setAcceptToc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { t } = useLanguage();
  const { refreshSession } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setMessage(null);
      setEmail("");
      setPassword("");
      setName("");
      setAcceptToc(false);
    }
  }, [isOpen, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        await refreshSession();
        onClose();

        // Redirect if enabled (default behavior)
        if (redirectAfterLogin) {
          const redirectPath =
            typeof redirectAfterLogin === "string"
              ? redirectAfterLogin
              : "/dashboard";
          router.push(redirectPath);
        }
      } else {
        // Validate TOC acceptance
        if (!acceptToc) {
          setError(
            t("auth.register.tocRequired") ||
              "You must accept the Terms and Conditions to register"
          );
          setLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name,
              },
              emailRedirectTo: `${window.location.origin}/auth/activate`,
            },
          });

        if (signUpError) throw signUpError;

        // Save TOC acceptance to database
        if (signUpData.user) {
          try {
            const response = await fetch("/api/users/toc", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                supabaseUserId: signUpData.user.id,
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

        setMessage(
          t("auth.registration.success") ||
            "Registration successful! Please check your email to verify your account."
        );
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || t("auth.error") || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 md:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
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
        </button>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {isLogin
            ? t("auth.login.title") || "Login"
            : t("auth.register.title") || "Register"}
        </h2>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.register.name") || "Full Name"}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={t("auth.register.namePlaceholder") || "Your name"}
              />
            </div>
          )}

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
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder={t("auth.passwordPlaceholder") || "Your password"}
            />
          </div>

          {!isLogin && (
            <div className="flex items-start">
              <input
                id="acceptToc"
                type="checkbox"
                checked={acceptToc}
                onChange={(e) => setAcceptToc(e.target.checked)}
                required
                className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label
                htmlFor="acceptToc"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                {t("auth.register.acceptToc") ||
                  "I accept the Terms and Conditions"}
              </label>
            </div>
          )}

          {isLogin && (
            <div className="text-right">
              <a
                href="/auth/reset-password"
                className="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400"
              >
                {t("auth.forgotPassword") || "Forgot password?"}
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? t("auth.loading") || "Loading..."
              : isLogin
              ? t("auth.login.submit") || "Login"
              : t("auth.register.submit") || "Register"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMessage(null);
            }}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400"
          >
            {isLogin
              ? t("auth.login.prompt") || "Don't have an account? Register"
              : t("auth.register.prompt") || "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
