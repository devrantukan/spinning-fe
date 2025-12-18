"use client";

import { useLanguage } from "../contexts/LanguageContext";

export default function Terms() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {t("terms.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {t("terms.lastUpdated")}
        </p>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => {
            const sectionKey = `terms.sections.section${num}`;
            const titleKey = `${sectionKey}.title`;
            const contentKey = `${sectionKey}.content`;
            const title = t(titleKey);
            const content = t(contentKey);

            // Skip if translation doesn't exist
            if (title === titleKey || content === contentKey) {
              return null;
            }

            return (
              <section key={num} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {num}. {title}
                </h2>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {content}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("terms.contact")}
          </p>
        </div>
      </div>
    </div>
  );
}




