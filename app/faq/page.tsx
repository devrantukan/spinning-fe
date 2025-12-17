"use client";

import { useLanguage } from "../contexts/LanguageContext";

export default function FAQ() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {t("faq.title")}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
          {t("faq.subtitle")}
        </p>

        <div className="space-y-6">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
            const questionKey = `faq.questions.q${num}.question`;
            const answerKey = `faq.questions.q${num}.answer`;
            const question = t(questionKey);
            const answer = t(answerKey);

            // Skip if translation doesn't exist (returns the key)
            if (question === questionKey || answer === answerKey) {
              return null;
            }

            return (
              <div
                key={num}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {question}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {answer}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-gray-700 dark:text-gray-300">{t("faq.contact")}</p>
        </div>
      </div>
    </div>
  );
}



