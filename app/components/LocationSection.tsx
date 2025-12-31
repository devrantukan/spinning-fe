"use client";

import { useLanguage } from "../contexts/LanguageContext";
import Link from "next/link"; // Added Link import

export default function LocationSection() {
  const { t } = useLanguage();

  return (
    <section className="py-24 section-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Info */}
            <div className="space-y-8 animate-fade-in-up">
                <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight">
                    {t("location.title")}
                </h2>
                <div className="space-y-4 text-lg text-gray-600 dark:text-gray-300 font-light">
                   <p>{t("location.address_line1")}</p>
                   <p>{t("location.address_line2")}</p>
                   {/* Real address from contact page */}
                   <p className="text-xl font-medium text-gray-900 dark:text-white mt-4">{t("contact.location.address")}</p>
                </div>

                <div className="pt-8">
                     <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        {t("location.description")}
                     </p>
                </div>
                
                 <div className="pt-4">
                     <Link
                       href="https://www.google.com/maps/dir/?api=1&destination=37.839389,27.236806" 
                       target="_blank"
                       className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-500 font-bold uppercase tracking-widest text-sm hover:underline"
                    >
                      <span>{t("location.get_directions")}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                 </div>
            </div>

            {/* Map Interactive Element */}
            <div className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden relative shadow-inner animate-fade-in-up [animation-delay:0.2s] border border-gray-200 dark:border-gray-700">
                <iframe
                  src="https://www.google.com/maps?q=Spin8%20Studio%20Indoor%20Cycling%20Club@(37.839389,27.236806)&hl=en&z=16&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
                  title="Spinning Club Location"
                />
            </div>
         </div>
      </div>
    </section>
  );
}
