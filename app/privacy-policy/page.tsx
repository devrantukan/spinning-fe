"use client";

import { useLanguage } from "../contexts/LanguageContext";

export default function PrivacyPolicy() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
          {t("privacyPolicy.title")}
        </h1>
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">
          <p className="text-lg text-gray-600 dark:text-gray-400 italic">
            {t("privacyPolicy.revision")}
          </p>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t("privacyPolicy.section1.title")}</h2>
            <div className="whitespace-pre-line leading-relaxed">
              {t("privacyPolicy.section1.content")}
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t("privacyPolicy.section2.title")}</h2>
            <div className="whitespace-pre-line leading-relaxed">
              {t("privacyPolicy.section2.content")}
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t("privacyPolicy.section3.title")}</h2>
            <p className="mb-4">
              {t("privacyPolicy.section3.content")}
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              {(t("privacyPolicy.section3.list") as unknown as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-sm italic text-gray-600 dark:text-gray-400">
              {t("privacyPolicy.section3.footer")}
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t("privacyPolicy.section4.title")}</h2>
            <p className="mb-4">
              {t("privacyPolicy.section4.content")}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              {(t("privacyPolicy.section4.list") as unknown as string[]).map((item, index) => (
                <li key={index} className="whitespace-pre-line">
                  <span dangerouslySetInnerHTML={{ 
                      __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                  }} />
                </li>
              ))}
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t("privacyPolicy.section5.title")}</h2>
            <div className="whitespace-pre-line mb-4">
              {t("privacyPolicy.section5.content")}
            </div>
            <ul className="list-disc pl-6 space-y-2">
              {(t("privacyPolicy.section5.list") as unknown as string[]).map((item, index) => (
                <li key={index}>
                   <span dangerouslySetInnerHTML={{ 
                      __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                  }} />
                </li>
              ))}
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t("privacyPolicy.section6.title")}</h2>
            <p className="mb-4">
              {t("privacyPolicy.section6.content")}
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              {(t("privacyPolicy.section6.list") as unknown as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-sm italic text-gray-600 dark:text-gray-400">
              {t("privacyPolicy.section6.footer")}
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t("privacyPolicy.section7.title")}</h2>
            <p className="mb-4">
              {t("privacyPolicy.section7.content")}
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              {(t("privacyPolicy.section7.list") as unknown as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-bold mb-2 text-gray-900 dark:text-gray-100">
                  <span dangerouslySetInnerHTML={{ 
                      __html: t("privacyPolicy.section7.subListTitle").replace(/\*\*(.*?)\*\*/g, '$1') 
                  }} />
              </p>
              <ul className="list-disc pl-6">
                  {(t("privacyPolicy.section7.subList") as unknown as string[]).map((item, index) => (
                      <li key={index}>{item}</li>
                  ))}
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t("privacyPolicy.section8.title")}</h2>
            <p className="mb-4">
              {t("privacyPolicy.section8.content")}
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              {(t("privacyPolicy.section8.list") as unknown as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-sm italic text-gray-600 dark:text-gray-400">
              {t("privacyPolicy.section8.footer")}
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t("privacyPolicy.section9.title")}</h2>
             <div className="whitespace-pre-line leading-relaxed">
              {t("privacyPolicy.section9.content")}
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t("privacyPolicy.section10.title")}</h2>
            <p className="mb-4">
              {t("privacyPolicy.section10.content")}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              {(t("privacyPolicy.section10.list") as unknown as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Changes Note */}
          <section className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-12">
            <h3 className="text-xl font-bold mb-4">{t("privacyPolicy.changes.title")}</h3>
            <p>
              {t("privacyPolicy.changes.content")}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
