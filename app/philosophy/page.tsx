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
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-orange-900/20 to-gray-900 dark:from-gray-950 dark:via-orange-950/30 dark:to-gray-950">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 md:py-28">
          <h2 className="text-sm md:text-base font-semibold text-orange-400 dark:text-orange-500 uppercase tracking-wider mb-6">
            {t("philosophy.hero.subtitle")}
          </h2>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-8 leading-tight">
            {t("philosophy.title")}
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 dark:text-gray-300 leading-relaxed mb-10 max-w-3xl mx-auto">
            {t("philosophy.hero.description")}
          </p>

          <div className="inline-block px-8 py-4 bg-orange-500 text-white text-xl md:text-2xl font-bold rounded-full shadow-lg hover:bg-orange-600 transition-colors duration-300">
            {t("philosophy.hero.tagline")}
          </div>
        </div>
      </section>

      {/* Tailored Approach Section */}
      <section className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t("philosophy.tailoredApproach.title")}
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto">
              {t("philosophy.tailoredApproach.description")}
            </p>
          </div>

          {/* Image Grid Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative h-64 rounded-xl overflow-hidden shadow-lg group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">🎵</div>
                    <p className="text-sm font-semibold">Class {i}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section - Clean Editorial Style */}
      <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 md:gap-16">
            {/* Left - Logo */}
            <div className="lg:col-span-1 flex items-start justify-start">
              <Logo className="h-32 md:h-40 w-auto" />
            </div>

            {/* Right - Mission & Vision */}
            <div className="lg:col-span-2 space-y-12 md:space-y-16">
              {/* Mission */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                  {t("philosophy.mission.title")}
                </h3>
                <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
                  {t("philosophy.mission.description")}
                </p>
              </div>

              {/* Vision */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                  {t("philosophy.vision.title")}
                </h3>
                <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
                  {t("philosophy.vision.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section with Enhanced Design */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t("philosophy.values.title")}
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {values.map((value, index) => (
              <div
                key={value.key}
                className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-8 md:p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
              >
                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 dark:bg-orange-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500"></div>

                <div className="relative z-10 flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg">
                      {value.icon}
                    </div>
                    <div className="text-5xl md:text-6xl font-bold text-orange-500/20 dark:text-orange-500/30">
                      {value.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                      {value.title}
                    </h3>
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-base md:text-lg space-y-4">
                      {value.description.split("\n\n").map((paragraph, idx) =>
                        paragraph.trim() ? (
                          <p key={idx} className="mb-4 last:mb-0">
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
