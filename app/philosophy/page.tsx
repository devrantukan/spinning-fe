"use client";

import { useLanguage } from "../contexts/LanguageContext";
import Logo from "../components/Logo";

export default function Philosophy() {
  const { t } = useLanguage();

  const values = [
    {
      key: "community",
      number: t("philosophy.values.community.number"),
      title: t("philosophy.values.community.title"),
      description: t("philosophy.values.community.description"),
      icon: "👥",
    },
    {
      key: "empowerment",
      number: t("philosophy.values.empowerment.number"),
      title: t("philosophy.values.empowerment.title"),
      description: t("philosophy.values.empowerment.description"),
      icon: "💪",
    },
    {
      key: "wellness",
      number: t("philosophy.values.wellness.number"),
      title: t("philosophy.values.wellness.title"),
      description: t("philosophy.values.wellness.description"),
      icon: "🧘",
    },
    {
      key: "professionalism",
      number: t("philosophy.values.professionalism.number"),
      title: t("philosophy.values.professionalism.title"),
      description: t("philosophy.values.professionalism.description"),
      icon: "⭐",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-16 md:pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-orange-900/20 to-gray-900 dark:from-gray-950 dark:via-orange-950/30 dark:to-gray-950">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-16 md:py-20 lg:py-28">
          <h2 className="text-xs sm:text-sm md:text-base font-semibold text-orange-400 dark:text-orange-500 uppercase tracking-wider mb-4 sm:mb-6">
            {t("philosophy.hero.subtitle")}
          </h2>

          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 md:mb-8 leading-tight px-2">
            {t("philosophy.title")}
          </h1>

          <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-gray-200 dark:text-gray-300 leading-relaxed mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto px-2">
            {t("philosophy.hero.description")}
          </p>

          <div className="inline-block px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-orange-500 text-white text-sm sm:text-base md:text-xl lg:text-2xl font-bold rounded-full shadow-lg hover:bg-orange-600 transition-colors duration-300">
            {t("philosophy.hero.tagline")}
          </div>
        </div>
      </section>

      {/* Tailored Approach Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-5 md:mb-6 px-2">
              {t("philosophy.tailoredApproach.title")}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto px-2">
              {t("philosophy.tailoredApproach.description")}
            </p>
          </div>

          {/* Image Grid Placeholder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mt-8 sm:mt-10 md:mt-12">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative h-48 sm:h-56 md:h-64 rounded-xl overflow-hidden shadow-lg group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <div className="text-center text-white">
                    <div className="text-3xl sm:text-4xl mb-2">🎵</div>
                    <p className="text-xs sm:text-sm font-semibold">
                      Class {i}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section - Clean Editorial Style */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12 lg:gap-16">
            {/* Left - Logo */}
            <div className="lg:col-span-1 flex items-center justify-center lg:items-start lg:justify-start">
              <Logo className="h-24 sm:h-28 md:h-32 lg:h-40 w-auto" />
            </div>

            {/* Right - Mission & Vision */}
            <div className="lg:col-span-2 space-y-8 sm:space-y-10 md:space-y-12 lg:space-y-16">
              {/* Mission */}
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 uppercase tracking-wider">
                  {t("philosophy.mission.title")}
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
                  {t("philosophy.mission.description")}
                </p>
              </div>

              {/* Vision */}
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 uppercase tracking-wider">
                  {t("philosophy.vision.title")}
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
                  {t("philosophy.vision.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section with Enhanced Design */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">
              {t("philosophy.values.title")}
            </h2>
            <div className="w-16 sm:w-20 md:w-24 h-0.5 sm:h-1 bg-orange-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8 lg:gap-10">
            {values.map((value, index) => (
              <div
                key={value.key}
                className="group relative bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 p-5 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 md:transform md:hover:-translate-y-2 overflow-hidden"
              >
                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 bg-orange-500/5 dark:bg-orange-500/10 rounded-bl-full transform translate-x-6 -translate-y-6 sm:translate-x-8 sm:-translate-y-8 md:group-hover:scale-150 transition-transform duration-500"></div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-5 md:gap-6">
                  <div className="flex-shrink-0 flex items-center gap-4 sm:block">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-20 md:h-20 bg-orange-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-lg">
                      {value.icon}
                    </div>
                    <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-orange-500/20 dark:text-orange-500/30 sm:mt-2 md:mt-4">
                      {value.number}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 md:mb-6">
                      {value.title}
                    </h3>
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg space-y-3 sm:space-y-4">
                      {value.description.split("\n\n").map((paragraph, idx) =>
                        paragraph.trim() ? (
                          <p key={idx} className="mb-3 sm:mb-4 last:mb-0">
                            {paragraph.trim()}
                          </p>
                        ) : null
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
