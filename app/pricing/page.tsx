'use client';

import { useLanguage } from "../contexts/LanguageContext";
import Logo from "../components/Logo";
import SocialIcons from "../components/SocialIcons";

export default function Pricing() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900 font-sans pt-16 md:pt-20">
      <main className="flex flex-col items-center justify-center gap-8 px-8">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <Logo className="h-32 md:h-48 lg:h-64 w-auto" />
          <div className="text-center">
            <p className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">
              {t('home.indoorCyclingClub')}
            </p>
            <p className="text-base md:text-lg text-gray-700 dark:text-gray-400">
              {t('home.location')}
            </p>
          </div>
        </div>
        <div className="text-center animate-fade-in-up max-w-2xl">
          <h1 className="text-5xl md:text-4xl font-bold tracking-wider mb-3 text-black dark:text-white">
            {t('home.comingSoon')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-900 dark:text-gray-300 mb-6 animate-fade-in-up [animation-delay:0.3s]">
            {t('home.message')}
          </p>
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse [animation-delay:0s]"></span>
              <span className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse [animation-delay:0.2s]"></span>
              <span className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse [animation-delay:0.4s]"></span>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-400 animate-fade-in-up [animation-delay:0.6s]">
              {t('home.stayTuned')}
            </p>
            <SocialIcons />
          </div>
        </div>
      </main>
    </div>
  );
}


