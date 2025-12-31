"use client";

import { useLanguage } from "../contexts/LanguageContext";
import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <div className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero_background_cycling_studio.png" // Assumes this will be moved to public
          alt="Studio Atmosphere"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 hero-overlay-base z-10 transition-colors duration-500" />
        <div className="absolute inset-0 hero-overlay-gradient z-10 transition-colors duration-500" />
      </div>

      {/* Content */}
      <div className="relative z-20 text-center px-4 max-w-5xl mx-auto flex flex-col items-center gap-8 animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">
          <span className="block mb-2">{t("hero.indoor")}</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-600 to-gray-800 dark:from-white dark:via-gray-200 dark:to-gray-400">
            {t("hero.cycling_studio")}
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 font-light tracking-wide max-w-2xl mx-auto">
          {t("hero.subtitle")}
        </p>

        <div className="flex flex-col md:flex-row gap-6 mt-8 w-full justify-center">
            <Link 
              href="/classes"
              className="px-8 py-4 bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-500 dark:text-white dark:hover:bg-orange-600 text-lg font-bold uppercase tracking-wider transition-all transform hover:scale-105"
            >
              {t("hero.book_class")}
            </Link>
            <Link
              href="/pricing" 
              className="px-8 py-4 border border-black text-black hover:bg-black/10 dark:border-white dark:text-white dark:hover:bg-white/10 text-lg font-bold uppercase tracking-wider transition-all backdrop-blur-sm"
            >
              {t("hero.view_packs")}
            </Link>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
        <svg 
          className="w-6 h-6 text-black dark:text-white opacity-70"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  );
}
