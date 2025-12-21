import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Our Philosophy - Spin Studio | Indoor Cycling Club Kuşadası",
    template: "%s | Spin Studio",
  },
  description:
    "Discover the philosophy behind Spin Studio indoor cycling club in Kuşadası, Aydın. Learn about our mission, vision, and values: community, empowerment, wellness, and professionalism. Join our journey to well-being and fitness. | Kuşadası, Aydın'daki Spin Studio Indoor Cycling Club'ın felsefesini keşfedin. Misyonumuz, vizyonumuz ve değerlerimiz hakkında bilgi edinin: topluluk, güçlendirme, sağlık ve profesyonellik. Sağlık ve fitness yolculuğumuza katılın.",
  keywords: [
    "spin studio",
    "indoor cycling",
    "kuşadası",
    "aydın",
    "türkiye",
    "philosophy",
    "mission",
    "vision",
    "values",
    "fitness",
    "cycling club",
    "spin class",
    "felsefe",
    "misyon",
    "vizyon",
    "değerler",
    "spinning",
    "bisiklet kulübü",
    "fitness merkezi",
    "wellness",
    "community",
    "empowerment",
    "professionalism",
  ],
  openGraph: {
    title:
      "Our Philosophy - Spin Studio | Indoor Cycling Club Kuşadası | Felsefemiz",
    description:
      "Discover the philosophy behind Spin Studio indoor cycling club. Learn about our mission, vision, and values. | Spin Studio Indoor Cycling Club'ın felsefesini keşfedin. Misyonumuz, vizyonumuz ve değerlerimiz hakkında bilgi edinin.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["tr_TR"],
    siteName: "Spin Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Philosophy - Spin Studio | Indoor Cycling Club Kuşadası",
    description:
      "Discover the philosophy behind Spin Studio indoor cycling club in Kuşadası, Aydın.",
  },
  alternates: {
    canonical: "/philosophy",
    languages: {
      en: "/philosophy",
      tr: "/philosophy",
      "x-default": "/philosophy",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function PhilosophyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Structured data for the philosophy page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Spin Studio - Indoor Cycling Club",
    alternateName: "Spin Studio - Indoor Cycling Club",
    description:
      "Premium indoor cycling club in Kuşadası, Aydın, Türkiye. Our philosophy focuses on community, empowerment, wellness, and professionalism. | Kuşadası, Aydın, Türkiye'de premium Indoor Cycling Club. Felsefemiz topluluk, güçlendirme, sağlık ve profesyonellik üzerine odaklanmaktadır.",
    url: "https://spin8studio.com/philosophy",
    inLanguage: ["en", "tr"],
    mission:
      "To provide a transformative indoor cycling experience that empowers people to unlock their full potential, overcome their mental barriers, and achieve their goals.",
    foundingLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Kuşadası",
        addressRegion: "Aydın",
        addressCountry: "TR",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      {children}
    </>
  );
}








