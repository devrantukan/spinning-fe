"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import Link from "next/link";

interface TermsSection {
  id: number;
  title: string;
  content: string;
}

export default function Terms() {
  const { t } = useLanguage();
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Get all terms sections
  const termsSections = useMemo(() => {
    const sections: TermsSection[] = [];
    for (let i = 1; i <= 15; i++) {
      const sectionKey = `terms.sections.section${i}`;
      const titleKey = `${sectionKey}.title`;
      const contentKey = `${sectionKey}.content`;
      const title = t(titleKey);
      const content = t(contentKey);

      // Skip if translation doesn't exist
      if (title !== titleKey && content !== contentKey) {
        sections.push({
          id: i,
          title,
          content,
        });
      }
    }
    return sections;
  }, [t]);

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return termsSections;

    const query = searchQuery.toLowerCase();
    return termsSections.filter(
      (section) =>
        section.title.toLowerCase().includes(query) ||
        section.content.toLowerCase().includes(query)
    );
  }, [termsSections, searchQuery]);

  const toggleSection = (id: number) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t("terms.title")}
          </h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-2">
            {t("terms.lastUpdated")}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-fade-in-up [animation-delay:0.1s]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("terms.searchPlaceholder") || "Search sections..."}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Clear search"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {filteredSections.length === 0
                ? t("terms.noResults") || "No sections found"
                : `${filteredSections.length} ${
                    filteredSections.length === 1 ? "section" : "sections"
                  } found`}
            </p>
          )}
        </div>

        {/* Terms Sections */}
        <div className="space-y-4 animate-fade-in-up [animation-delay:0.2s]">
          {filteredSections.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t("terms.noResults") || "No sections found"}
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors"
              >
                {t("terms.clearSearch") || "Clear search"}
              </button>
            </div>
          ) : (
            filteredSections.map((section, index) => {
              const isOpen = openSections.has(section.id);
              return (
                <div
                  key={section.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-semibold text-sm">
                        {section.id}
                      </span>
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex-1">
                        {section.title}
                      </h2>
                    </div>
                    <svg
                      className={`shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-5 pt-0">
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="pt-4 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                          {section.content}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 p-6 md:p-8 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800 animate-fade-in-up [animation-delay:0.3s]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t("terms.contactTitle") || "Have questions?"}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {t("terms.contact")}
              </p>
            </div>
            <Link
              href="/contact"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap"
            >
              {t("nav.contact") || "Contact Us"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
