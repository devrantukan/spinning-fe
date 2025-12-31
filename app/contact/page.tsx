"use client";

import { useState } from "react";
import Image from "next/image";
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
  const { t, language } = useLanguage();
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
  const mapEmbedUrl = `https://www.google.com/maps?q=Spin8%20Studio%20Indoor%20Cycling%20Club@(37.839389,27.236806)&hl=en&z=16&output=embed`;
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

    try {
      const submitData = {
        ...validationResult.data,
        phone:
          validationResult.data.phone && countryCode
            ? `${countryCode}${validationResult.data.phone}`
            : validationResult.data.phone || undefined,
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-sans pt-16 md:pt-20 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/contact_hero_samos.png"
            alt="Spin8 Club Location - Samos View"
            fill
            className="object-cover object-center"
            priority
            quality={100}
          />
          {/* Overlays for readability */}
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-gray-950 z-10" />
        </div>

        <div className="relative z-20 container mx-auto px-4 text-center animate-fade-in-up">
          <h2 className="text-sm md:text-base font-semibold text-orange-600 dark:text-orange-500 uppercase tracking-[0.2em] mb-4">
            {t("contact.subtitle").toLocaleUpperCase(language === "tr" ? "tr-TR" : "en-US")}
          </h2>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 uppercase tracking-tight drop-shadow-lg">
            {t("contact.title").toLocaleUpperCase(language === "tr" ? "tr-TR" : "en-US")}
          </h1>
        </div>
      </section>

      {/* Main Content: Split Layout */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-20 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Contact Info & Value Prop */}
          <div className="lg:col-span-5 space-y-8 animate-fade-in-up [animation-delay:0.2s]">
            <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-8 rounded-2xl shadow-xl transition-colors duration-300">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wide">
                {t("contact.info.title")}
              </h3>
              
              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center start-icon group-hover:bg-orange-500 transition-colors duration-300">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-500 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{t("contact.info.email")}</p>
                    <a href="mailto:info@spin8studio.com" className="text-lg text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-500 transition-colors font-medium">
                      info@spin8studio.com
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center start-icon group-hover:bg-orange-500 transition-colors duration-300">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-500 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{t("contact.info.phone")}</p>
                    <a href="tel:+905441571549" className="text-lg text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-500 transition-colors font-medium">
                      +90 544 157 15 49
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center start-icon group-hover:bg-orange-500 transition-colors duration-300">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-500 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{t("contact.info.address")}</p>
                    <p className="text-lg text-gray-900 dark:text-white leading-relaxed">
                      {t("contact.location.address")}
                    </p>
                  </div>
                </div>
              </div>

               <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">{t("contact.social.title")}</h4>
                  <SocialIcons />
               </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 animate-fade-in-up [animation-delay:0.4s]">
            <div className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 transition-colors duration-300">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wide">
                {t("contact.form.message")}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("contact.form.name")}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t("contact.form.namePlaceholder")}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600 focus:ring-orange-500"
                      } bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("contact.form.email")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t("contact.form.emailPlaceholder")}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600 focus:ring-orange-500"
                      } bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("contact.form.phone")}
                  </label>
                  <div className="flex gap-3">
                    <select
                      id="countryCode"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-32 px-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {countries.map((country) => (
                        <option key={`${country.code}-${country.name}`} value={country.code}>
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
                         setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "") }));
                         if(errors.phone) setErrors(prev => ({...prev, phone: ""}));
                      }}
                      placeholder={t("contact.form.phonePlaceholder")}
                      className={`flex-1 px-4 py-3 rounded-xl border ${
                        errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600 focus:ring-orange-500"
                      } bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    />
                  </div>
                   {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("contact.form.message")}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder={t("contact.form.messagePlaceholder")}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.message ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600 focus:ring-orange-500"
                    } bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all resize-none`}
                  />
                  {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
                </div>

                {/* Status Messages */}
                {submitStatus === "success" && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm font-medium">{t("contact.form.success")}</span>
                  </div>
                )}
                {submitStatus === "error" && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm font-medium">{t("contact.form.error")}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm md:text-base mt-2"
                >
                  {isSubmitting ? t("contact.form.sending") : t("contact.form.submit")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Map Section */}
      <section className="relative z-10 w-full h-[50vh] min-h-[400px] mt-12 bg-white dark:bg-gray-900 group">
         <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white to-transparent dark:from-gray-950 z-20 pointer-events-none" />
         
         {/* Map Iframe - Static Background */}
         <iframe
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, filter: "grayscale(100%) invert(0%) contrast(100%)" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Spinning Club Location"
            className="w-full h-full opacity-100 dark:opacity-60 transition- all duration-500 pointer-events-none dark:invert dark:grayscale"
          />

         {/* Custom Orange Marker Overlay */}
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 -mt-4">
            <div className="relative">
               <span className="absolute flex h-8 w-8 -top-2 -left-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 ml-2.5 mt-2.5"></span>
               </span>
               <svg className="w-12 h-12 text-orange-500 drop-shadow-2xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
               </svg>
            </div>
         </div>

         <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-orange-500 hover:text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>{t("contact.location.getDirections")}</span>
            </a>
         </div>
      </section>
    </div>
  );
}
