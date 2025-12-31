"use client";

import { useLanguage } from "../contexts/LanguageContext";
import Image from "next/image";

export default function CommunitySection() {
  const { t } = useLanguage();

  return (
    <section className="py-24 section-bg-secondary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-gray-200 to-transparent dark:from-gray-800" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row gap-16 items-center">
            {/* Visual - Left on desktop (alternating layout) */}
            <div className="w-full md:w-1/2 relative h-[500px] rounded-lg overflow-hidden shadow-2xl animate-fade-in-up md:order-1 order-2">
                 <Image
                    src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=2690&auto=format&fit=crop" 
                    alt="Community"
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                 />
                 <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Text - Right on desktop */}
            <div className="w-full md:w-1/2 space-y-8 animate-fade-in-up [animation-delay:0.2s] md:order-2 order-1">
                <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                    {t("community.title")}
                </h2>
                <div className="h-1 w-20 bg-orange-500 rounded-full" />

                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                    {t("community.description_1")}
                </p>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 font-light leading-relaxed">
                    {t("community.description_2")}
                </p>
            </div>
        </div>
      </div>
    </section>
  );
}
