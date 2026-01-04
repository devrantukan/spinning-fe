"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import SocialIcons from "./SocialIcons";
import Logo from "./Logo";
import AuthModal from "./AuthModal";

export default function Footer() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const menuItems = [
    { href: "/team", key: "nav.team" },
    { href: "/philosophy", key: "nav.philosophy" },
    { href: "/classes", key: "nav.classes" },
    // { href: "/pricing", key: "nav.pricing" }, // Hidden in original footer too? Kept consistent if desired, or adding back. Original had it.
    { href: "/contact", key: "nav.contact" },
  ];

  const currentYear = new Date().getFullYear();

  const handleJoinUsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      router.push("/dashboard");
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <footer className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white pt-20 pb-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Ghost Logo - Absolute Positioned on Left */}
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
         <Logo className="w-full h-full text-zinc-900 dark:text-white fill-current" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-24">
            
            {/* Left: Brand / Intro */}
            <div className="lg:w-1/3 space-y-6">
                <Link href="/" className="block w-fit">
                    <Logo className="h-12 w-auto text-zinc-900 dark:text-white fill-current" />
                </Link>
                <p className="text-gray-600 dark:text-gray-400 font-light leading-relaxed max-w-sm">
                    {t("hero.subtitle")}
                </p>
                <div className="pt-4">
                    <button 
                        onClick={handleJoinUsClick}
                        className="inline-flex items-center justify-center px-8 py-3 bg-orange-500 !text-white hover:bg-orange-600 transition-colors duration-200 rounded-full font-semibold"
                    >
                        {t("nav.joinUs")}
                    </button>
                </div>
            </div>

            {/* Right: Contacts & Links */}
            <div className="lg:w-2/3 flex flex-col md:flex-row gap-12 md:gap-24 w-full">
                
                {/* Contact Info */}
                <div className="space-y-6 flex-1">
                    <h3 className="text-lg font-bold uppercase tracking-wider text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-4">
                        {t("footer.contacts")}
                    </h3>
                    <div className="space-y-4 text-gray-600 dark:text-gray-400 font-light">
                        <div className="flex items-start gap-3">
                            <span className="text-orange-500 mt-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </span>
                            <p className="leading-relaxed">
                                Kadınlar Denizi, 14. Sk.,<br/>09400 Kuşadası/Aydın
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                             <span className="text-orange-500">
                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.2 53.7 21.8 57.4 2.6 3.7 37.8 57.7 91.5 80.8 12.7 5.5 22.6 8.8 30.2 11.2 12.8 4 24.5 3.4 33.8 2 10.3-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                             </span>
                             <a href="https://wa.me/905441571549" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                                Whatsapp +90 544 157 15 49
                             </a>
                        </div>
                        <div className="flex items-center gap-3">
                             <span className="text-orange-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                             </span>
                             <a href="mailto:info@spin8studio.com" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                                info@spin8studio.com
                             </a>
                        </div>
                    </div>
                    {/* Socials on Mobile */}
                    <div className="pt-4  flex md:hidden">
                        <SocialIcons />
                    </div>
                </div>

                {/* Navigation (Hidden on small mobile? No, stack it) */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold uppercase tracking-wider text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-4">
                        Link
                    </h3>
                    <nav className="flex flex-col space-y-3">
                        {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors duration-200"
                        >
                            {t(item.key)}
                        </Link>
                        ))}
                        <Link
                            href="/faq"
                            className="text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors duration-200"
                        >
                            {t("footer.faq")}
                        </Link>
                    </nav>
                     {/* Socials on Desktop */}
                    <div className="pt-8 hidden md:block">
                        <SocialIcons />
                    </div>
                </div>

            </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
                <span>&copy; {currentYear} Spin8 Studio. {t("footer.allRightsReserved")}</span>
                <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    {t("footer.terms")}
                </Link>
                <Link href="/cookie-policy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    {t("footer.cookiePolicy")}
                </Link>
                <Link href="/privacy-policy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    {t("footer.privacyPolicy")}
                </Link>
            </div>

            <div className="flex items-center gap-2">
                 <span className="opacity-70">Technology by</span>
                 <a
                    href="https://tukanft.com/tr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:opacity-100 transition-opacity"
                 >
                    <span className="text-orange-500 font-medium">TukanFT</span>
                    <Image
                        alt="TukanFT Logo"
                        src="https://tukanft.com/toucan.svg"
                        width={20}
                        height={20}
                        className="h-5 w-auto"
                        loading="lazy"
                    />
                 </a>
            </div>
        </div>
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </footer>
  );
}
