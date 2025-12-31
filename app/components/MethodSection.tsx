"use client";

import { useLanguage } from "../contexts/LanguageContext";
import Link from "next/link"; // Added Link import

export default function MethodSection() {
  const { t } = useLanguage();

  return (
    <section className="py-24 section-bg-primary overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Text Content - Left on desktop */}
          <div className="space-y-8 animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-gray-400">
                {t("method.beyond_workout")}
              </h2>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 font-light leading-relaxed">
                 {t("method.description_1")}
              </p>
              
              <div className="pt-4 space-y-4">
                  <h3 className="text-2xl font-bold uppercase tracking-wide border-l-4 border-orange-500 pl-4 text-gray-900 dark:text-white">
                    {t("method.our_method")}
                  </h3>
                  <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 font-light leading-relaxed">
                     {t("method.description_2")}
                  </p>
              </div>

               <div className="pt-6">
                <Link
                  href="/pricing" 
                  className="inline-block border-b-2 border-orange-500 text-orange-600 dark:text-orange-500 font-bold uppercase tracking-widest text-sm hover:text-orange-700 dark:hover:text-orange-400 transition-colors pb-1"
                >
                  {t("method.view_packs")}
                </Link>
              </div>
          </div>
          
          {/* Visual - Right on desktop */}
          <div className="relative h-[600px] w-full rounded-2xl overflow-hidden glass dark:glass-dark shadow-2xl animate-fade-in-up [animation-delay:0.2s] border border-gray-200 dark:border-gray-800">
             {/* Using a placeholder gradient/effect for now, or could use another generated image if requested. 
                 For now, a sleek abstract representation. */}
             <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900/90 p-10 flex flex-col justify-between transition-colors duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 dark:bg-orange-500/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="z-10 space-y-12 mt-12">
                     <div className="space-y-2">
                         <span className="text-6xl font-black text-black/10 dark:text-white/50 block">01</span>
                         <h4 className="text-xl font-bold text-gray-900 dark:text-white uppercase">{t("method.rhythm")}</h4>
                         <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{t("method.rhythm_desc")}</p>
                     </div>
                     <div className="space-y-2">
                         <span className="text-6xl font-black text-black/10 dark:text-white/50 block">02</span>
                         <h4 className="text-xl font-bold text-gray-900 dark:text-white uppercase">{t("method.sculpt")}</h4>
                         <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{t("method.sculpt_desc")}</p>
                     </div>
                     <div className="space-y-2">
                         <span className="text-6xl font-black text-black/10 dark:text-white/50 block">03</span>
                         <h4 className="text-xl font-bold text-gray-900 dark:text-white uppercase">{t("method.engage")}</h4>
                         <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{t("method.engage_desc")}</p>
                     </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
