"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import ThemeSwitcher from "./ThemeSwitcher";
import Logo from "./Logo";
import AuthModal from "./AuthModal";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleJoinUsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      router.push("/dashboard");
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const menuItems = [
    { href: "/", key: "nav.home" },
    { href: "/about", key: "nav.about" },
    { href: "/philosophy", key: "nav.philosophy" },
    { href: "/classes", key: "nav.classes" },
    { href: "/pricing", key: "nav.pricing" },
    { href: "/contact", key: "nav.contact" },
  ];

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "tr" : "en");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-md">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center">
            <Logo />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {!user &&
              menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-900 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-500 font-medium transition-colors duration-200"
                >
                  {t(item.key)}
                </Link>
              ))}
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-900 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-500 font-medium transition-colors duration-200"
                >
                  {t("dashboard.title") || "Dashboard"}
                </Link>
                <Link
                  href="/classes"
                  className="text-gray-900 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-500 font-medium transition-colors duration-200"
                >
                  {t("nav.classes")}
                </Link>
              </>
            )}
            {user ? (
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600 transition-colors duration-200 cursor-pointer"
              >
                {t("dashboard.signOut") || "Sign Out"}
              </button>
            ) : (
              <button
                onClick={handleJoinUsClick}
                className="bg-orange-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-orange-600 transition-colors duration-200 cursor-pointer"
              >
                {t("nav.joinUs")}
              </button>
            )}
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 hover:text-orange-500 dark:hover:text-orange-500 transition-colors duration-200 font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
              aria-label="Toggle language"
            >
              <span className="text-sm">{language === "en" ? "TR" : "EN"}</span>
            </button>
            {/* Theme Switcher */}
            <ThemeSwitcher />
          </div>

          {/* Mobile Menu Button and Language Switcher */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
              aria-label="Toggle language"
            >
              <span className="text-xs font-medium">
                {language === "en" ? "TR" : "EN"}
              </span>
            </button>
            <ThemeSwitcher />
            <button
              onClick={toggleMenu}
              className="flex flex-col justify-center items-center w-8 h-8 space-y-1.5 focus:outline-none text-gray-900 dark:text-white"
              aria-label="Toggle menu"
            >
              <span
                className={`block w-6 h-0.5 transition-all duration-300 ${
                  isMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
                style={{ backgroundColor: "currentColor" }}
              />
              <span
                className={`block w-6 h-0.5 transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
                style={{ backgroundColor: "currentColor" }}
              />
              <span
                className={`block w-6 h-0.5 transition-all duration-300 ${
                  isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
                style={{ backgroundColor: "currentColor" }}
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 px-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
            {!user &&
              menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-gray-900 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-500 font-medium py-2 transition-colors duration-200"
                >
                  {t(item.key)}
                </Link>
              ))}
            {user && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-gray-900 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-500 font-medium py-2 transition-colors duration-200"
                >
                  {t("dashboard.title") || "Dashboard"}
                </Link>
                <Link
                  href="/classes"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-gray-900 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-500 font-medium py-2 transition-colors duration-200"
                >
                  {t("nav.classes")}
                </Link>
              </>
            )}
            {user ? (
              <button
                onClick={async () => {
                  setIsMenuOpen(false);
                  await handleSignOut();
                }}
                className="w-full bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition-colors duration-200 text-center mt-4 cursor-pointer"
              >
                {t("dashboard.signOut") || "Sign Out"}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  setIsMenuOpen(false);
                  handleJoinUsClick(e);
                }}
                className="w-full bg-orange-500 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors duration-200 text-center mt-4 cursor-pointer text-sm sm:text-base whitespace-nowrap"
              >
                {t("nav.joinUs")}
              </button>
            )}
          </div>
        </div>
      </nav>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}
