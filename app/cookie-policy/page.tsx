"use client";

import { useLanguage } from "../contexts/LanguageContext";

export default function CookiePolicy() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
          {t("cookiePolicy.title") || "Cookie Policy"}
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {t("cookiePolicy.intro.title")}
            </h2>
            <p>{t("cookiePolicy.intro.p1")}</p>
            <p className="mt-4">{t("cookiePolicy.intro.p2")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {t("cookiePolicy.manager.title")}
            </h2>
            <p>
              {t("cookiePolicy.manager.p1")}
              <br />
              <strong>{t("cookiePolicy.manager.name")}</strong>
              <br />
              {t("cookiePolicy.manager.address1")}
              <br />
              {t("cookiePolicy.manager.address2")}
            </p>
            <p className="mt-4">{t("cookiePolicy.manager.p2")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {t("cookiePolicy.collection.title")}
            </h2>
            <p>{t("cookiePolicy.collection.p1")}</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li
                dangerouslySetInnerHTML={{
                  __html: t("cookiePolicy.collection.list.technical"),
                }}
              />
              <li
                dangerouslySetInnerHTML={{
                  __html: t("cookiePolicy.collection.list.preferences"),
                }}
              />
              <li
                dangerouslySetInnerHTML={{
                  __html: t("cookiePolicy.collection.list.stats"),
                }}
              />
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {t("cookiePolicy.types.title")}
            </h2>
            <p>{t("cookiePolicy.types.p1")}</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li
                dangerouslySetInnerHTML={{
                  __html: t("cookiePolicy.types.list.necessary"),
                }}
              />
              <li
                dangerouslySetInnerHTML={{
                  __html: t("cookiePolicy.types.list.preferences"),
                }}
              />
              <li
                dangerouslySetInnerHTML={{
                  __html: t("cookiePolicy.types.list.analytics"),
                }}
              />
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {t("cookiePolicy.consent.title")}
            </h2>
            <p>{t("cookiePolicy.consent.p1")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {t("cookiePolicy.protection.title")}
            </h2>
            <p>{t("cookiePolicy.protection.p1")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {t("cookiePolicy.rights.title")}
            </h2>
            <p>{t("cookiePolicy.rights.p1")}</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>{t("cookiePolicy.rights.list.rectification")}</li>
              <li>{t("cookiePolicy.rights.list.access")}</li>
              <li>{t("cookiePolicy.rights.list.restriction")}</li>
            </ul>
            <p className="mt-4">{t("cookiePolicy.rights.p2")}</p>
          </section>

          <section>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-12">
              {t("cookiePolicy.revision")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
