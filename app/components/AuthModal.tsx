"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Toast from "./Toast";
import Image from "next/image";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  redirectAfterLogin?: boolean;
  initialMode?: "login" | "register";
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  redirectAfterLogin = true,
  initialMode = "login",
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [countryCode, setCountryCode] = useState("+90");
  const [mobilePhone, setMobilePhone] = useState("");

  // Update isLogin when initialMode changes
  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === "login");
    }
  }, [isOpen, initialMode]);

  // Country codes with flags and names - sorted alphabetically
  const countries = [
    { code: "+355", flag: "🇦🇱", name: "Albania" },
    { code: "+213", flag: "🇩🇿", name: "Algeria" },
    { code: "+376", flag: "🇦🇩", name: "Andorra" },
    { code: "+244", flag: "🇦🇴", name: "Angola" },
    { code: "+54", flag: "🇦🇷", name: "Argentina" },
    { code: "+374", flag: "🇦🇲", name: "Armenia" },
    { code: "+61", flag: "🇦🇺", name: "Australia" },
    { code: "+43", flag: "🇦🇹", name: "Austria" },
    { code: "+994", flag: "🇦🇿", name: "Azerbaijan" },
    { code: "+973", flag: "🇧🇭", name: "Bahrain" },
    { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
    { code: "+375", flag: "🇧🇾", name: "Belarus" },
    { code: "+32", flag: "🇧🇪", name: "Belgium" },
    { code: "+501", flag: "🇧🇿", name: "Belize" },
    { code: "+229", flag: "🇧🇯", name: "Benin" },
    { code: "+975", flag: "🇧🇹", name: "Bhutan" },
    { code: "+591", flag: "🇧🇴", name: "Bolivia" },
    { code: "+387", flag: "🇧🇦", name: "Bosnia and Herzegovina" },
    { code: "+267", flag: "🇧🇼", name: "Botswana" },
    { code: "+55", flag: "🇧🇷", name: "Brazil" },
    { code: "+673", flag: "🇧🇳", name: "Brunei" },
    { code: "+359", flag: "🇧🇬", name: "Bulgaria" },
    { code: "+226", flag: "🇧🇫", name: "Burkina Faso" },
    { code: "+855", flag: "🇰🇭", name: "Cambodia" },
    { code: "+237", flag: "🇨🇲", name: "Cameroon" },
    { code: "+1", flag: "🇨🇦", name: "Canada" },
    { code: "+238", flag: "🇨🇻", name: "Cape Verde" },
    { code: "+236", flag: "🇨🇫", name: "Central African Republic" },
    { code: "+235", flag: "🇹🇩", name: "Chad" },
    { code: "+86", flag: "🇨🇳", name: "China" },
    { code: "+57", flag: "🇨🇴", name: "Colombia" },
    { code: "+269", flag: "🇰🇲", name: "Comoros" },
    { code: "+243", flag: "🇨🇩", name: "DR Congo" },
    { code: "+242", flag: "🇨🇬", name: "Republic of the Congo" },
    { code: "+506", flag: "🇨🇷", name: "Costa Rica" },
    { code: "+385", flag: "🇭🇷", name: "Croatia" },
    { code: "+357", flag: "🇨🇾", name: "Cyprus" },
    { code: "+420", flag: "🇨🇿", name: "Czech Republic" },
    { code: "+45", flag: "🇩🇰", name: "Denmark" },
    { code: "+253", flag: "🇩🇯", name: "Djibouti" },
    { code: "+20", flag: "🇪🇬", name: "Egypt" },
    { code: "+503", flag: "🇸🇻", name: "El Salvador" },
    { code: "+240", flag: "🇬🇶", name: "Equatorial Guinea" },
    { code: "+291", flag: "🇪🇷", name: "Eritrea" },
    { code: "+372", flag: "🇪🇪", name: "Estonia" },
    { code: "+251", flag: "🇪🇹", name: "Ethiopia" },
    { code: "+679", flag: "🇫🇯", name: "Fiji" },
    { code: "+358", flag: "🇫🇮", name: "Finland" },
    { code: "+33", flag: "🇫🇷", name: "France" },
    { code: "+241", flag: "🇬🇦", name: "Gabon" },
    { code: "+220", flag: "🇬🇲", name: "Gambia" },
    { code: "+995", flag: "🇬🇪", name: "Georgia" },
    { code: "+49", flag: "🇩🇪", name: "Germany" },
    { code: "+233", flag: "🇬🇭", name: "Ghana" },
    { code: "+350", flag: "🇬🇮", name: "Gibraltar" },
    { code: "+30", flag: "🇬🇷", name: "Greece" },
    { code: "+224", flag: "🇬🇳", name: "Guinea" },
    { code: "+245", flag: "🇬🇼", name: "Guinea-Bissau" },
    { code: "+592", flag: "🇬🇾", name: "Guyana" },
    { code: "+509", flag: "🇭🇹", name: "Haiti" },
    { code: "+504", flag: "🇭🇳", name: "Honduras" },
    { code: "+852", flag: "🇭🇰", name: "Hong Kong" },
    { code: "+36", flag: "🇭🇺", name: "Hungary" },
    { code: "+354", flag: "🇮🇸", name: "Iceland" },
    { code: "+91", flag: "🇮🇳", name: "India" },
    { code: "+62", flag: "🇮🇩", name: "Indonesia" },
    { code: "+98", flag: "🇮🇷", name: "Iran" },
    { code: "+964", flag: "🇮🇶", name: "Iraq" },
    { code: "+353", flag: "🇮🇪", name: "Ireland" },
    { code: "+972", flag: "🇮🇱", name: "Israel" },
    { code: "+39", flag: "🇮🇹", name: "Italy" },
    { code: "+225", flag: "🇨🇮", name: "Ivory Coast" },
    { code: "+81", flag: "🇯🇵", name: "Japan" },
    { code: "+962", flag: "🇯🇴", name: "Jordan" },
    { code: "+7", flag: "🇰🇿", name: "Kazakhstan" },
    { code: "+254", flag: "🇰🇪", name: "Kenya" },
    { code: "+383", flag: "🇽🇰", name: "Kosovo" },
    { code: "+965", flag: "🇰🇼", name: "Kuwait" },
    { code: "+996", flag: "🇰🇬", name: "Kyrgyzstan" },
    { code: "+856", flag: "🇱🇦", name: "Laos" },
    { code: "+371", flag: "🇱🇻", name: "Latvia" },
    { code: "+961", flag: "🇱🇧", name: "Lebanon" },
    { code: "+231", flag: "🇱🇷", name: "Liberia" },
    { code: "+423", flag: "🇱🇮", name: "Liechtenstein" },
    { code: "+370", flag: "🇱🇹", name: "Lithuania" },
    { code: "+352", flag: "🇱🇺", name: "Luxembourg" },
    { code: "+853", flag: "🇲🇴", name: "Macau" },
    { code: "+389", flag: "🇲🇰", name: "North Macedonia" },
    { code: "+261", flag: "🇲🇬", name: "Madagascar" },
    { code: "+265", flag: "🇲🇼", name: "Malawi" },
    { code: "+60", flag: "🇲🇾", name: "Malaysia" },
    { code: "+960", flag: "🇲🇻", name: "Maldives" },
    { code: "+223", flag: "🇲🇱", name: "Mali" },
    { code: "+356", flag: "🇲🇹", name: "Malta" },
    { code: "+222", flag: "🇲🇷", name: "Mauritania" },
    { code: "+230", flag: "🇲🇺", name: "Mauritius" },
    { code: "+52", flag: "🇲🇽", name: "Mexico" },
    { code: "+373", flag: "🇲🇩", name: "Moldova" },
    { code: "+377", flag: "🇲🇨", name: "Monaco" },
    { code: "+976", flag: "🇲🇳", name: "Mongolia" },
    { code: "+382", flag: "🇲🇪", name: "Montenegro" },
    { code: "+212", flag: "🇲🇦", name: "Morocco" },
    { code: "+258", flag: "🇲🇿", name: "Mozambique" },
    { code: "+95", flag: "🇲🇲", name: "Myanmar" },
    { code: "+264", flag: "🇳🇦", name: "Namibia" },
    { code: "+977", flag: "🇳🇵", name: "Nepal" },
    { code: "+31", flag: "🇳🇱", name: "Netherlands" },
    { code: "+64", flag: "🇳🇿", name: "New Zealand" },
    { code: "+505", flag: "🇳🇮", name: "Nicaragua" },
    { code: "+227", flag: "🇳🇪", name: "Niger" },
    { code: "+234", flag: "🇳🇬", name: "Nigeria" },
    { code: "+850", flag: "🇰🇵", name: "North Korea" },
    { code: "+47", flag: "🇳🇴", name: "Norway" },
    { code: "+968", flag: "🇴🇲", name: "Oman" },
    { code: "+92", flag: "🇵🇰", name: "Pakistan" },
    { code: "+507", flag: "🇵🇦", name: "Panama" },
    { code: "+970", flag: "🇵🇸", name: "Palestine" },
    { code: "+595", flag: "🇵🇾", name: "Paraguay" },
    { code: "+63", flag: "🇵🇭", name: "Philippines" },
    { code: "+48", flag: "🇵🇱", name: "Poland" },
    { code: "+351", flag: "🇵🇹", name: "Portugal" },
    { code: "+974", flag: "🇶🇦", name: "Qatar" },
    { code: "+40", flag: "🇷🇴", name: "Romania" },
    { code: "+7", flag: "🇷🇺", name: "Russia" },
    { code: "+250", flag: "🇷🇼", name: "Rwanda" },
    { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
    { code: "+221", flag: "🇸🇳", name: "Senegal" },
    { code: "+381", flag: "🇷🇸", name: "Serbia" },
    { code: "+232", flag: "🇸🇱", name: "Sierra Leone" },
    { code: "+65", flag: "🇸🇬", name: "Singapore" },
    { code: "+421", flag: "🇸🇰", name: "Slovakia" },
    { code: "+386", flag: "🇸🇮", name: "Slovenia" },
    { code: "+252", flag: "🇸🇴", name: "Somalia" },
    { code: "+27", flag: "🇿🇦", name: "South Africa" },
    { code: "+82", flag: "🇰🇷", name: "South Korea" },
    { code: "+34", flag: "🇪🇸", name: "Spain" },
    { code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
    { code: "+249", flag: "🇸🇩", name: "Sudan" },
    { code: "+597", flag: "🇸🇷", name: "Suriname" },
    { code: "+46", flag: "🇸🇪", name: "Sweden" },
    { code: "+41", flag: "🇨🇭", name: "Switzerland" },
    { code: "+963", flag: "🇸🇾", name: "Syria" },
    { code: "+886", flag: "🇹🇼", name: "Taiwan" },
    { code: "+992", flag: "🇹🇯", name: "Tajikistan" },
    { code: "+255", flag: "🇹🇿", name: "Tanzania" },
    { code: "+66", flag: "🇹🇭", name: "Thailand" },
    { code: "+228", flag: "🇹🇬", name: "Togo" },
    { code: "+993", flag: "🇹🇲", name: "Turkmenistan" },
    { code: "+90", flag: "🇹🇷", name: "Turkey" },
    { code: "+256", flag: "🇺🇬", name: "Uganda" },
    { code: "+380", flag: "🇺🇦", name: "Ukraine" },
    { code: "+971", flag: "🇦🇪", name: "UAE" },
    { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
    { code: "+1", flag: "🇺🇸", name: "United States" },
    { code: "+598", flag: "🇺🇾", name: "Uruguay" },
    { code: "+998", flag: "🇺🇿", name: "Uzbekistan" },
    { code: "+379", flag: "🇻🇦", name: "Vatican City" },
    { code: "+84", flag: "🇻🇳", name: "Vietnam" },
    { code: "+967", flag: "🇾🇪", name: "Yemen" },
    { code: "+260", flag: "🇿🇲", name: "Zambia" },
    { code: "+263", flag: "🇿🇼", name: "Zimbabwe" },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const [acceptToc, setAcceptToc] = useState(false);
  const [acceptLiabilityWaiver, setAcceptLiabilityWaiver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [organizationName, setOrganizationName] =
    useState<string>("Spin8 Studio");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const { t, language } = useLanguage();
  const { refreshSession } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Create validation schemas with language-specific messages
  // Note: These are recreated when language changes via the `t` function
  const loginSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, t("auth.validation.emailRequired") || "Email is required")
          .email(t("auth.validation.emailInvalid") || "Invalid email format"),
        password: z
          .string()
          .min(
            1,
            t("auth.validation.passwordRequired") || "Password is required"
          ),
      }),
    [t]
  );

  const registerSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(1, t("auth.validation.nameRequired") || "Name is required")
          .min(
            2,
            t("auth.validation.nameMinLength") ||
              "Name must be at least 2 characters"
          ),
        identityNumber: z
          .string()
          .min(
            1,
            t("auth.validation.identityNumberRequired") ||
              "Identity Number is required"
          )
          .length(
            11,
            t("auth.validation.identityNumberInvalid") ||
              "Identity Number must be 11 digits"
          )
          .regex(/^\d+$/, t("auth.validation.identityNumberInvalid") || "Identity Number must contain only numbers"),
        email: z
          .string()
          .min(1, t("auth.validation.emailRequired") || "Email is required")
          .email(t("auth.validation.emailInvalid") || "Invalid email format"),
        dobDay: z
          .string()
          .min(1, t("auth.validation.dobDayRequired") || "Day is required"),
        dobMonth: z
          .string()
          .min(1, t("auth.validation.dobMonthRequired") || "Month is required"),
        dobYear: z
          .string()
          .min(1, t("auth.validation.dobYearRequired") || "Year is required"),
        mobilePhone: z
          .string()
          .min(
            1,
            t("auth.validation.mobilePhoneRequired") ||
              "Mobile phone is required"
          )
          .regex(
            /^\d+$/,
            t("auth.validation.mobilePhoneInvalid") ||
              "Mobile phone must contain only numbers"
          ),
        acceptToc: z.boolean().refine((val) => val === true, {
          message:
            t("auth.register.tocRequired") ||
            "You must accept the Terms and Conditions to register",
        }),
        acceptLiabilityWaiver: z.boolean().refine((val) => val === true, {
          message:
            t("auth.register.liabilityWaiverRequired") ||
            "You must accept the liability waiver to register",
        }),
      }),
    [t]
  );

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setMessage(null);
      setFieldErrors({});
      setEmail("");
      setPassword("");
      setName("");
      setIdentityNumber("");
      setDobDay("");
      setDobMonth("");
      setDobYear("");
      setCountryCode("+90");
      setMobilePhone("");
      setAcceptToc(false);
      setAcceptLiabilityWaiver(false);

      // Fetch organization name
      const fetchOrganizationName = async () => {
        try {
          const response = await fetch("/api/organization");
          if (response.ok) {
            const org = await response.json();
            if (org?.name) {
              setOrganizationName(org.name);
            }
          }
        } catch (err) {
          console.error("Error fetching organization name:", err);
          // Keep default "Spin8 Studio"
        }
      };
      fetchOrganizationName();
    }
  }, [isOpen, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called", { isLogin, loading });

    setError(null);
    setMessage(null);
    setFieldErrors({});

    // Prevent double submission
    if (loading) {
      console.log("Already loading, returning");
      return;
    }

    try {
      if (isLogin) {
        console.log("Processing login");
        // Validate login form
        const loginResult = loginSchema.safeParse({ email, password });

        if (!loginResult.success) {
          const errors: Record<string, string> = {};
          loginResult.error.issues.forEach((issue: z.ZodIssue) => {
            const fieldName = issue.path[0]?.toString();
            if (fieldName) {
              errors[fieldName] = issue.message;
            }
          });
          setFieldErrors(errors);
          return;
        }

        setLoading(true);

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        await refreshSession();

        const loginSuccessKey = "auth.login.success";
        const loginSuccessTranslation = t(loginSuccessKey);
        const loginSuccessMessage =
          loginSuccessTranslation !== loginSuccessKey
            ? loginSuccessTranslation
            : "Login successful!";
        setToast({
          message: loginSuccessMessage,
          type: "success",
        });

        // Call onLoginSuccess callback if provided, otherwise redirect
        if (onLoginSuccess) {
          onLoginSuccess();
          onClose();
        } else {
          onClose();
          if (redirectAfterLogin) {
            router.push("/dashboard");
          }
        }
      } else {
        console.log("Processing registration", {
          name,
          email,
          dobDay,
          dobMonth,
          dobYear,
          mobilePhone,
          acceptToc,
          acceptLiabilityWaiver,
        });

        // Validate registration form
        const registerResult = registerSchema.safeParse({
          name,
          identityNumber,
          email,
          dobDay,
          dobMonth,
          dobYear,
          mobilePhone,
          acceptToc,
          acceptLiabilityWaiver,
        });

        console.log("Validation result:", registerResult.success);

        if (!registerResult.success) {
          console.log("Validation failed:", registerResult.error.issues);
          const errors: Record<string, string> = {};
          registerResult.error.issues.forEach((issue: z.ZodIssue) => {
            const fieldName = issue.path[0]?.toString();
            if (fieldName) {
              errors[fieldName] = issue.message;
            }
          });
          setFieldErrors(errors);
          return;
        }

        console.log("Validation passed, setting loading to true");
        setLoading(true);

        // Generate a temporary random password for passwordless signup
        // User will set their password after email confirmation
        const tempPassword =
          Math.random().toString(36).slice(-12) +
          Math.random().toString(36).slice(-12) +
          "A1!";

        console.log("Starting user creation via Admin API");
        // Create user using Admin API to prevent Supabase from sending default email
        const createUserResponse = await fetch("/api/auth/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: tempPassword,
            userMetadata: {
              name: name,
              identityNumber: identityNumber,
              dob:
                dobYear && dobMonth && dobDay
                  ? `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(
                      2,
                      "0"
                    )}`
                  : "",
              mobilePhone:
                countryCode && mobilePhone
                  ? `${countryCode}${mobilePhone}`
                  : mobilePhone,
              countryCode: countryCode,
              tocAccepted: acceptToc,
              tocAcceptedAt: acceptToc ? new Date().toISOString() : null,
              liabilityWaiverAccepted: acceptLiabilityWaiver,
              liabilityWaiverAcceptedAt: acceptLiabilityWaiver
                ? new Date().toISOString()
                : null,
            },
          }),
        });

        if (!createUserResponse.ok) {
          const errorData = await createUserResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create user");
        }

        const createUserData = await createUserResponse.json();
        const signUpData = { user: createUserData.user };

        console.log("User created successfully", {
          hasUser: !!signUpData.user,
        });

        console.log("Signup successful, showing success message");
        // Immediately show success message and reset loading
        const successKey = "auth.register.success";
        const successTranslation = t(successKey);
        const successMessage =
          successTranslation !== successKey
            ? successTranslation
            : "Registration successful! Please check your email to verify your account.";
        setMessage(successMessage);
        setToast({
          message: successMessage,
          type: "success",
        });
        setLoading(false);
        setIsLogin(true);
        console.log("Registration flow completed");

        // Save TOC acceptance to database and create member record (non-blocking)
        if (signUpData?.user) {
          // Save TOC acceptance and liability waiver (fire and forget)
          // This will also create the member record after user record is created/updated
          fetch("/api/users/toc", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              supabaseUserId: signUpData.user.id,
              accepted: acceptToc,
              liabilityWaiverAccepted: acceptLiabilityWaiver,
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(
                  "Error saving TOC acceptance and liability waiver:",
                  errorData
                );
              } else {
                console.log(
                  "TOC acceptance and user record saved successfully"
                );
              }
            })
            .catch((err) => {
              console.error(
                "Error saving TOC acceptance and liability waiver:",
                err
              );
            });

          // Generate confirmation link and send email using organization SMTP (fire and forget)
          // Pass the temporary password so it matches what was used during user creation
          fetch("/api/auth/generate-confirmation-link", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email,
              password: tempPassword, // Pass the same password used during user creation
            }),
          })
            .then((linkResponse) => {
              if (linkResponse.ok) {
                return linkResponse.json();
              }
              throw new Error("Failed to generate confirmation link");
            })
            .then((linkData) => {
              if (linkData?.confirmationToken) {
                // Send confirmation email using organization SMTP
                return fetch("/api/auth/send-confirmation-email", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    email: email,
                    name: name,
                    confirmationToken: linkData.confirmationToken,
                    language: language || "en",
                  }),
                });
              }
            })
            .catch((err) => {
              console.error("Error sending confirmation email:", err);
            });
        }
      }
    } catch (err: unknown) {
      console.error("Error in handleSubmit:", err);
      setLoading(false);
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("auth.error") || "An error occurred";
      setError(errorMessage);
      setToast({
        message: errorMessage,
        type: "error",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-hidden">
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

        <div className="relative z-20 bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-xl max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 m-0 border border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1 transition-colors"
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <>
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
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          name: undefined,
                        }));
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      fieldErrors.name
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder={
                      t("auth.register.namePlaceholder") || "Your name"
                    }
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="identityNumber"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t("auth.register.identityNumber") || "Identity Number"}
                  </label>
                  <input
                    id="identityNumber"
                    type="text"
                    value={identityNumber}
                    onChange={(e) => {
                      // Only allow numbers and max 11 chars
                      const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setIdentityNumber(val);
                      if (fieldErrors.identityNumber) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          identityNumber: undefined,
                        }));
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      fieldErrors.identityNumber
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder={
                      t("auth.register.identityNumberPlaceholder") || "12345678901"
                    }
                  />
                  {fieldErrors.identityNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {fieldErrors.identityNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="dob"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t("auth.register.dob") || "Date of Birth"}
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <select
                      id="dobDay"
                      value={dobDay}
                      onChange={(e) => {
                        setDobDay(e.target.value);
                        if (fieldErrors.dobDay) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            dobDay: undefined,
                          }));
                        }
                      }}
                      className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        fieldErrors.dobDay
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <option value="">
                        {t("auth.register.day") || "Day"}
                      </option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        )
                      )}
                    </select>
                    <select
                      id="dobMonth"
                      value={dobMonth}
                      onChange={(e) => {
                        setDobMonth(e.target.value);
                        if (fieldErrors.dobMonth) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            dobMonth: undefined,
                          }));
                        }
                      }}
                      className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        fieldErrors.dobMonth
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <option value="">
                        {t("auth.register.month") || "Month"}
                      </option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (month) => (
                          <option key={month} value={month}>
                            {t(`auth.register.months.${month}`) || month}
                          </option>
                        )
                      )}
                    </select>
                    <select
                      id="dobYear"
                      value={dobYear}
                      onChange={(e) => {
                        setDobYear(e.target.value);
                        if (fieldErrors.dobYear) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            dobYear: undefined,
                          }));
                        }
                      }}
                      className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        fieldErrors.dobYear
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <option value="">
                        {t("auth.register.year") || "Year"}
                      </option>
                      {Array.from(
                        { length: 100 },
                        (_, i) => new Date().getFullYear() - i
                      ).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(fieldErrors.dobDay ||
                    fieldErrors.dobMonth ||
                    fieldErrors.dobYear) && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {fieldErrors.dobDay ||
                        fieldErrors.dobMonth ||
                        fieldErrors.dobYear}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="mobilePhone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t("auth.register.mobilePhone") || "Mobile Phone"}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      id="countryCode"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full sm:w-56 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    >
                      {countries.map((country) => (
                        <option
                          key={`${country.code}-${country.name}`}
                          value={country.code}
                        >
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      id="mobilePhone"
                      type="tel"
                      value={mobilePhone}
                      onChange={(e) => {
                        setMobilePhone(e.target.value.replace(/\D/g, ""));
                        if (fieldErrors.mobilePhone) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            mobilePhone: undefined,
                          }));
                        }
                      }}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        fieldErrors.mobilePhone
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder={
                        t("auth.register.mobilePhonePlaceholder") ||
                        "555 123 4567"
                      }
                    />
                  </div>
                  {fieldErrors.mobilePhone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {fieldErrors.mobilePhone}
                    </p>
                  )}
                </div>
              </>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  fieldErrors.email
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={
                  t("auth.emailPlaceholder") || "your.email@example.com"
                }
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {isLogin && (
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
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }));
                    }
                  }}
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
            )}

            {!isLogin && (
              <>
                <div className="flex items-start">
                  <input
                    id="acceptToc"
                    type="checkbox"
                    checked={acceptToc}
                    onChange={(e) => {
                      setAcceptToc(e.target.checked);
                      if (fieldErrors.acceptToc) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          acceptToc: undefined,
                        }));
                      }
                    }}
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
                {fieldErrors.acceptToc && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.acceptToc}
                  </p>
                )}

                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 max-h-64 sm:max-h-96 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    {t("auth.register.liabilityWaiver.title") || "DECLARE"}
                  </h3>
                  <div className="text-xs text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                    <p>
                      {t("auth.register.liabilityWaiver.declare1") ||
                        "1. that I have been duly informed of the necessity to provide medical certification proving my fitness for non-competitive sports activities;"}
                    </p>
                    <p>
                      {t("auth.register.liabilityWaiver.declare2") ||
                        "2. that I am in adequate mental and physical condition for the activity;"}
                    </p>
                    <p>
                      {t("auth.register.liabilityWaiver.declare3") ||
                        "3. that I have not used and will not use narcotic and/or psychotropic substances in the 48 hours preceding the activity, am not under the effect of medications, and have not overindulged in alcohol or food;"}
                    </p>
                    <p>
                      {(
                        t("auth.register.liabilityWaiver.declare4") ||
                        '4. that I am aware of the risks, both foreseeable and unforeseeable, associated with the activities I will perform at {organizationName} (the "Studio"), though this activity cannot be considered inherently dangerous;'
                      ).replace("{organizationName}", organizationName)}
                    </p>
                    <p>
                      {t("auth.register.liabilityWaiver.declare5") ||
                        "5. that I will provide the above-mentioned medical certification upon my next entry, requesting permission to attend the Studio from the date of this document."}
                    </p>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    {t("auth.register.liabilityWaiver.furtherDeclare") ||
                      "I FURTHER DECLARE"}
                  </h3>
                  <div className="text-xs text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                    <p>
                      {t("auth.register.liabilityWaiver.furtherDeclare6") ||
                        "6. that I assume full responsibility for my own person, including any personal damage and/or damage caused to others (and/or to property) due to behavior that does not conform to the rules;"}
                    </p>
                    <p>
                      {(
                        t("auth.register.liabilityWaiver.furtherDeclare7") ||
                        "7. for myself and my heirs and/or assigns, to release {organizationName}, its collaborators and/or employees, as well as their heirs and/or assigns, from any liability for injury, death, and/or any kind of damage (including that caused by third parties) that may arise to my person as a result of the activities performed at the Studio;"
                      ).replace("{organizationName}", organizationName)}
                    </p>
                    <p>
                      {t("auth.register.liabilityWaiver.furtherDeclare8") ||
                        "8. that I have carefully read and evaluated the content of this document and have clearly understood the meaning of each individual point before signing it."}
                    </p>
                  </div>

                  <div className="text-xs text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                    <p>
                      {t("auth.register.liabilityWaiver.understanding") ||
                        "I fully understand and agree with the purpose of these rules, established for my safety, and I recognize that failing to comply with them may place me in a dangerous situation. In accordance with articles 1341 and 1342 of the Civil Code, I specifically approve points 1, 2, 3, 4, 5, 6, and 7 of this agreement."}
                    </p>
                    <p>
                      {t("auth.register.liabilityWaiver.pursuant") ||
                        "Pursuant to and in accordance with art. 1469 bis of the Civil Code, this waiver does not extend to acts and/or omissions of the Studio and its staff."}
                    </p>
                  </div>

                  <div className="flex items-start mt-4">
                    <input
                      id="acceptLiabilityWaiver"
                      type="checkbox"
                      checked={acceptLiabilityWaiver}
                      onChange={(e) => {
                        setAcceptLiabilityWaiver(e.target.checked);
                        if (fieldErrors.acceptLiabilityWaiver) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            acceptLiabilityWaiver: undefined,
                          }));
                        }
                      }}
                      className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="acceptLiabilityWaiver"
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {t("auth.register.acceptLiabilityWaiver") ||
                        "I acknowledge that I have read, fully understood and accept the above liability waiver"}
                    </label>
                  </div>
                  {fieldErrors.acceptLiabilityWaiver && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {fieldErrors.acceptLiabilityWaiver}
                    </p>
                  )}
                </div>
              </>
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
    </>
  );
}
