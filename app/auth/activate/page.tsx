"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "../../contexts/LanguageContext";
import Link from "next/link";

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const { t } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    const handleActivation = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const next = searchParams.get("next") || "/dashboard";

      if (token_hash && type) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });

          if (error) {
            setStatus("error");
            setMessage(
              t("auth.activate.error") ||
                "Activation failed. The link may have expired."
            );
          } else {
            setStatus("success");
            setMessage(
              t("auth.activate.success") ||
                "Account activated successfully! Redirecting..."
            );
            setTimeout(() => {
              router.push(next);
            }, 2000);
          }
        } catch (err) {
          setStatus("error");
          setMessage(
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
  }, [searchParams, router, supabase.auth, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 pt-20 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
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
              {t("auth.activate.successTitle") || "Account Activated!"}
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

