"use client";

import { useState } from "react";
import { z } from "zod";
import { useLanguage } from "../contexts/LanguageContext";
import SocialIcons from "../components/SocialIcons";

// Zod validation schema for contact form
const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 10,
      "Phone number must be at least 10 characters"
    ),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters")
    .trim(),
});

export default function Contact() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [countryCode, setCountryCode] = useState("+90");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Country codes with flags and names - same as register form
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
    { code: "+502", flag: "🇬🇹", name: "Guatemala" },
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
    { code: "+965", flag: "🇰🇼", name: "Kuwait" },
    { code: "+996", flag: "🇰🇬", name: "Kyrgyzstan" },
    { code: "+856", flag: "🇱🇦", name: "Laos" },
    { code: "+371", flag: "🇱🇻", name: "Latvia" },
    { code: "+961", flag: "🇱🇧", name: "Lebanon" },
    { code: "+266", flag: "🇱🇸", name: "Lesotho" },
    { code: "+231", flag: "🇱🇷", name: "Liberia" },
    { code: "+218", flag: "🇱🇾", name: "Libya" },
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
    { code: "+212", flag: "🇲🇦", name: "Morocco" },
    { code: "+258", flag: "🇲🇿", name: "Mozambique" },
    { code: "+95", flag: "🇲🇲", name: "Myanmar" },
    { code: "+264", flag: "🇳🇦", name: "Namibia" },
    { code: "+977", flag: "🇳🇵", name: "Nepal" },
    { code: "+31", flag: "🇳🇱", name: "Netherlands" },
    { code: "+64", flag: "🇳🇿", name: "New Zealand" },
    { code: "+234", flag: "🇳🇬", name: "Nigeria" },
    { code: "+47", flag: "🇳🇴", name: "Norway" },
    { code: "+968", flag: "🇴🇲", name: "Oman" },
    { code: "+92", flag: "🇵🇰", name: "Pakistan" },
    { code: "+970", flag: "🇵🇸", name: "Palestine" },
    { code: "+507", flag: "🇵🇦", name: "Panama" },
    { code: "+595", flag: "🇵🇾", name: "Paraguay" },
    { code: "+51", flag: "🇵🇪", name: "Peru" },
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
    { code: "+65", flag: "🇸🇬", name: "Singapore" },
    { code: "+421", flag: "🇸🇰", name: "Slovakia" },
    { code: "+386", flag: "🇸🇮", name: "Slovenia" },
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
    { code: "+216", flag: "🇹🇳", name: "Tunisia" },
    { code: "+90", flag: "🇹🇷", name: "Turkey" },
    { code: "+993", flag: "🇹🇲", name: "Turkmenistan" },
    { code: "+971", flag: "🇦🇪", name: "UAE" },
    { code: "+256", flag: "🇺🇬", name: "Uganda" },
    { code: "+380", flag: "🇺🇦", name: "Ukraine" },
    { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
    { code: "+1", flag: "🇺🇸", name: "United States" },
    { code: "+598", flag: "🇺🇾", name: "Uruguay" },
    { code: "+998", flag: "🇺🇿", name: "Uzbekistan" },
    { code: "+58", flag: "🇻🇪", name: "Venezuela" },
    { code: "+84", flag: "🇻🇳", name: "Vietnam" },
    { code: "+967", flag: "🇾🇪", name: "Yemen" },
    { code: "+260", flag: "🇿🇲", name: "Zambia" },
    { code: "+263", flag: "🇿🇼", name: "Zimbabwe" },
  ];

  // Google Maps embed URL for Spin8 Studio Indoor Cycling Club
  // Coordinates: 37°50'21.8"N 27°14'12.5"E (37.839389, 27.236806)
  const mapEmbedUrl = `https://www.google.com/maps?q=Spin8%20Studio%20Indoor%20Cycling%20Club@(37.839389,27.236806)&hl=en&z=16&output=embed`;

  // Google Maps directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=37.839389,27.236806`;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrors({});

    // Validate form data with Zod
    const validationResult = contactFormSchema.safeParse(formData);

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    // Submit to API
    try {
      // Combine country code with phone number if phone is provided
      const submitData = {
        ...validationResult.data,
        phone:
          validationResult.data.phone && countryCode
            ? `${countryCode}${validationResult.data.phone}`
            : validationResult.data.phone || undefined,
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send message");
      }

      setSubmitStatus("success");
      setFormData({ name: "", email: "", phone: "", message: "" });
      setCountryCode("+90");
      setErrors({});
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-white dark:bg-gray-900 font-sans pt-16 md:pt-20 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Header */}
        <div className="text-center mb-4 md:mb-6 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t("contact.title")}
          </h1>
          <p className="text-base md:text-lg text-gray-900 dark:text-gray-400">
            {t("contact.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Contact Form */}
          <div className="animate-fade-in-up [animation-delay:0.2s]">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg border border-gray-200 dark:border-gray-700 h-fit">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t("contact.form.message")}
              </h2>

              <form
                onSubmit={handleSubmit}
                className="space-y-3 md:space-y-4"
                noValidate
              >
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs md:text-sm font-medium text-gray-900 dark:text-gray-300 mb-1"
                  >
                    {t("contact.form.name")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("contact.form.namePlaceholder")}
                    className={`w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg border ${
                      errors.name
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-700 text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs md:text-sm font-medium text-gray-900 dark:text-gray-300 mb-1"
                  >
                    {t("contact.form.email")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("contact.form.emailPlaceholder")}
                    className={`w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg border ${
                      errors.email
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-700 text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs md:text-sm font-medium text-gray-900 dark:text-gray-300 mb-1"
                  >
                    {t("contact.form.phone")}
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
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value.replace(/\D/g, ""),
                        }));
                        if (errors.phone) {
                          setErrors((prev) => ({
                            ...prev,
                            phone: undefined,
                          }));
                        }
                      }}
                      placeholder={t("contact.form.phonePlaceholder")}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.phone
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs md:text-sm font-medium text-gray-900 dark:text-gray-300 mb-1"
                  >
                    {t("contact.form.message")}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    placeholder={t("contact.form.messagePlaceholder")}
                    className={`w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg border ${
                      errors.message
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-700 text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.message}
                    </p>
                  )}
                </div>

                {submitStatus === "success" && (
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400">
                    {t("contact.form.success")}
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
                    {t("contact.form.error")}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 md:py-2.5 px-4 rounded-lg text-sm md:text-base transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {isSubmitting
                    ? t("contact.form.sending")
                    : t("contact.form.submit")}
                </button>
              </form>
            </div>
          </div>

          {/* Map and Location Info */}
          <div className="space-y-4 md:space-y-5 animate-fade-in-up [animation-delay:0.4s]">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
                {t("contact.info.title")}
              </h2>
              <div className="space-y-3">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-400 mb-0.5">
                      {t("contact.info.email")}
                    </p>
                    <a
                      href="mailto:info@spin8studio.com"
                      className="text-sm md:text-base text-gray-900 dark:text-white hover:text-orange-500 transition-colors"
                    >
                      info@spin8studio.com
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-400 mb-0.5">
                      {t("contact.info.phone")}
                    </p>
                    <a
                      href="tel:+905441571549"
                      className="text-sm md:text-base text-gray-900 dark:text-white hover:text-orange-500 transition-colors"
                    >
                      +90 544 157 15 49
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-400 mb-0.5">
                      {t("contact.info.address")}
                    </p>
                    <p className="text-sm md:text-base text-gray-900 dark:text-white">
                      {t("contact.location.address")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">
                {t("contact.location.title")}
              </h2>
              <p className="text-sm md:text-base text-gray-900 dark:text-gray-400 mb-3">
                {t("contact.location.address")}
              </p>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg text-sm md:text-base transition-colors duration-200 mb-3 md:mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                {t("contact.location.getDirections")}
              </a>
              <div className="w-full h-48 md:h-56 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                  title="Spinning Club Location"
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
                {t("contact.social.title")}
              </h2>
              <SocialIcons />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
