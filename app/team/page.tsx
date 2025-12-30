"use client";

import { useLanguage } from "../contexts/LanguageContext";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Instructor {
  id: string;
  name: string;
  role?: string;
  description?: string;
  image?: string;
}

export default function Team() {
  const { t } = useLanguage();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const response = await fetch("/api/instructors");
        if (response.ok) {
          const data = await response.json();
          setInstructors(data);
        }
      } catch (error) {
        console.error("Error fetching instructors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop"
          alt="Spinning Class"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-white dark:to-gray-900" />
        <div className="relative z-10 text-center animate-fade-in-up px-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-white uppercase drop-shadow-lg">
            {t("team.title")}
          </h1>
          <div className="text-xl md:text-3xl text-yellow-500 font-medium tracking-wide uppercase drop-shadow-md">
            {t("team.subtitle")}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Team Grid */}
        {instructors.length > 0 ? (
          <div className={`grid grid-cols-1 gap-6 md:gap-8 mb-24 ${
            instructors.length === 2 
              ? "md:grid-cols-2 max-w-4xl mx-auto" 
              : "md:grid-cols-2 lg:grid-cols-3"
          }`}>
            {instructors.map((member, index) => (
              <div
                key={member.id}
                className="group relative overflow-hidden rounded-lg aspect-[3/4] animate-fade-in-up shadow-xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Image */}
                <Image
                  src={member.image || "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=2787&auto=format&fit=crop"}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Overlay Gradient - Keep dark for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-300" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-2xl font-bold text-white mb-1 uppercase italic">
                    {member.name}
                  </h3>
                  <div className="text-yellow-500 font-semibold mb-3 uppercase text-sm tracking-wider">
                    {member.role}
                  </div>
                  <div className="text-gray-300 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    {member.description}
                  </div>
                  
                  <button className="text-white text-sm font-bold uppercase tracking-widest border-b-2 border-yellow-500 pb-1 hover:text-yellow-500 transition-colors duration-300">
                    {t("team.viewProfile")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-2xl text-gray-500 dark:text-gray-400 italic">
              {t("team.noInstructorsFound")}
            </p>
          </div>
        )}

        {/* Exclusive Guest Trainers Section */}
        <div className="max-w-4xl mx-auto py-16 md:py-24 text-center animate-fade-in-up">
          <div className="space-y-8">
            <p className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white uppercase tracking-tight italic">
              {t("team.guestTrainers.title")}
            </p>
            <div className="space-y-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-light">
              <div>
                {t("team.guestTrainers.description1")}
              </div>
              <div>
                {t("team.guestTrainers.description2")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
