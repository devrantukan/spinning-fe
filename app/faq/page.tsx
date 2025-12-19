"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import Link from "next/link";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function FAQ() {
  const { t } = useLanguage();
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Get all FAQ items
  const faqItems = useMemo(() => {
    const items: FAQItem[] = [];
    for (let i = 1; i <= 10; i++) {
      const questionKey = `faq.questions.q${i}.question`;
      const answerKey = `faq.questions.q${i}.answer`;
      const question = t(questionKey);
      const answer = t(answerKey);

      // Skip if translation doesn't exist (returns the key)
      if (question !== questionKey && answer !== answerKey) {
        items.push({
          id: i,
          question,
          answer,
        });
      }
    }
    return items;
  }, [t]);

  // Filter FAQ items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return faqItems;

    const query = searchQuery.toLowerCase();
    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [faqItems, searchQuery]);

  const toggleItem = (id: number) => {
    setOpenItems((prev) => {
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
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t("faq.title")}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("faq.subtitle")}
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
              placeholder={t("faq.searchPlaceholder") || "Search questions..."}
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
              {filteredItems.length === 0
                ? t("faq.noResults") || "No questions found"
                : `${filteredItems.length} ${
                    filteredItems.length === 1 ? "question" : "questions"
                  } found`}
            </p>
          )}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 animate-fade-in-up [animation-delay:0.2s]">
          {filteredItems.length === 0 ? (
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t("faq.noResults") || "No questions found"}
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors"
              >
                {t("faq.clearSearch") || "Clear search"}
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isOpen = openItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    aria-expanded={isOpen}
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex-1">
                      {item.question}
                    </h3>
                    <svg
                      className={`flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
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
                        ? "max-h-[1000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-5 pt-0">
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line pt-4">
                          {item.answer}
                        </p>
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
                {t("faq.contactTitle") || "Still have questions?"}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {t("faq.contact")}
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
