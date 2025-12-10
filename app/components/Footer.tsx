"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  const menuItems = [
    { href: "/", key: "nav.home" },
    { href: "/about", key: "nav.about" },
    { href: "/philosophy", key: "nav.philosophy" },
    { href: "/classes", key: "nav.classes" },
    { href: "/pricing", key: "nav.pricing" },
    { href: "/contact", key: "nav.contact" },
  ];

  return (
    <footer className="w-full py-6 px-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative md:static">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center md:justify-start items-center gap-4 md:gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-900 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-500 font-medium transition-colors duration-200 text-sm md:text-base"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          {/* TukanFT Credit */}
          <div className="flex flex-row justify-center md:justify-end items-center">
            <p className="text-neutral-900 dark:text-neutral-100 font-normal mr-2 text-sm md:text-base">
              Technology by{" "}
              <a
                target="_blank"
                href="https://tukanft.com/tr"
                className="text-orange-500 hover:text-orange-600 transition-colors duration-200"
                rel="noopener noreferrer"
              >
                TukanFT
              </a>
            </p>
            <a
              target="_blank"
              href="https://tukanft.com/tr"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity duration-200"
            >
              <Image
                alt="TukanFT Logo"
                src="https://tukanft.com/toucan.svg"
                width={40}
                height={40}
                className="mx-auto lg:mx-0 h-[25px] w-auto"
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
