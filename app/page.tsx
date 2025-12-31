"use client";

import { useEffect } from "react";
import { useLanguage } from "./contexts/LanguageContext";
import HeroSection from "./components/HeroSection";
import MethodSection from "./components/MethodSection";
import CommunitySection from "./components/CommunitySection";
import LocationSection from "./components/LocationSection";

export default function Home() {
  const { t } = useLanguage();

  useEffect(() => {
    // Check if there are invitation tokens in the URL hash
    const hash = window.location.hash.substring(1);
    if (hash) {
      const params = new URLSearchParams(hash);
      const type = params.get("type");
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      // If it's an invitation, redirect to accept-invitation page
      if (type === "invite" && access_token && refresh_token) {
        window.location.href = `/accept-invitation${window.location.hash}`;
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <HeroSection />
      <MethodSection />
      <CommunitySection />
      <LocationSection />
    </main>
  );
}
