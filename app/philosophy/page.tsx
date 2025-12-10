"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../components/Logo";
import AuthModal from "../components/AuthModal";
import { useState } from "react";

function JoinUsButton() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      router.push("/dashboard");
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-block px-8 py-4 bg-white text-orange-500 font-bold text-lg rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
      >
        {t("nav.joinUs")}
      </button>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}

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

  const quotes = [
    { text: t("philosophy.quotes.inspire"), size: "large" },
    { text: t("philosophy.quotes.rideJourney"), size: "medium" },
    { text: t("philosophy.quotes.shoulderToShoulder"), size: "medium" },
    { text: t("philosophy.quotes.bestSelf"), size: "large" },
    { text: t("philosophy.quotes.innerPotential"), size: "medium" },
    { text: t("philosophy.quotes.findYourself"), size: "medium" },
    { text: t("philosophy.quotes.findCircle"), size: "large" },
    { text: t("philosophy.quotes.buildCircle"), size: "medium" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-16 md:pt-20">
      {/* Hero Section with Background */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-gray-900/50 to-orange-600/20 dark:from-orange-500/10 dark:via-gray-900/80 dark:to-orange-600/10"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h2 className="text-sm md:text-base font-semibold text-orange-400 dark:text-orange-500 uppercase tracking-wider mb-6 animate-fade-in-up">
            {t("philosophy.hero.subtitle")}
          </h2>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight animate-fade-in-up [animation-delay:0.1s]">
            {t("philosophy.title")}
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 dark:text-gray-200 leading-relaxed mb-8 max-w-3xl mx-auto animate-fade-in-up [animation-delay:0.2s]">
            {t("philosophy.hero.description")}
          </p>
          <div className="inline-block px-8 py-4 bg-orange-500 text-white text-2xl md:text-3xl font-bold rounded-full shadow-2xl transform hover:scale-105 transition-transform duration-300 animate-fade-in-up [animation-delay:0.3s]">
            {t("philosophy.hero.tagline")}
          </div>
        </div>
      </section>

      {/* Shared Journey Section with Image Placeholder */}
      <section className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image Placeholder - Replace with actual cycling image */}
            <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <div className="text-6xl mb-4">🚴</div>
                  <p className="text-lg font-semibold">Cycling Community</p>
                  <p className="text-sm opacity-90 mt-2">Replace with actual image</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                {t("philosophy.sharedJourney.title")}
              </h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                {t("philosophy.sharedJourney.description")}
              </p>
            </div>
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
              <div key={i} className="relative h-64 rounded-xl overflow-hidden shadow-lg group">
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

      {/* Inspirational Quotes Section - Clean Minimalist Magazine Style */}
      <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-start">
            {/* Left Side - Club Name & Tagline */}
            <div className="space-y-6">
              <div>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
                  SPIN8
                </h2>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-2">
                  INDOOR CYCLING CLUB
                </h3>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wider mt-6">
                  THE FITNESS
                </p>
                <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                  A COMMUNITY FOR
                </p>
              </div>
            </div>

            {/* Right Side - Motivational Quotes in Red */}
            <div className="space-y-6 md:space-y-8">
              {quotes.map((quote, index) => (
                <div
                  key={index}
                  className="border-l-4 border-orange-500 pl-6 md:pl-8 py-2"
                >
                  <p 
                    className={`font-bold text-orange-500 dark:text-orange-400 leading-relaxed tracking-tight ${
                      quote.size === "large" 
                        ? "text-2xl md:text-3xl lg:text-4xl" 
                        : "text-xl md:text-2xl lg:text-3xl"
                    }`}
                    style={{
                      letterSpacing: "0.02em"
                    }}
                  >
                    {quote.text}
                  </p>
                </div>
              ))}
            </div>
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
                      {value.description.split('\n\n').map((paragraph, idx) => 
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

      {/* Call to Action Section */}
      <section className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t("philosophy.quotes.findCircle")}
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            {t("philosophy.quotes.buildCircle")}
          </p>
          <JoinUsButton />
        </div>
      </section>
    </div>
  );
}
