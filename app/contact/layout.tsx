import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Contact Us - Spin Studio | Indoor Cycling Club Kuşadası",
    template: "%s | Spin Studio",
  },
  description:
    "Get in touch with Spin Studio indoor cycling club in Kuşadası, Aydın. Contact us at Kadınlar Denizi, 14. Sk., 09400 Kuşadası/Aydın. Call +90 544 157 15 49 or email info@spin8studio.com | Kuşadası, Aydın'daki Spin Studio Indoor Cycling Club ile iletişime geçin. Kadınlar Denizi, 14. Sk., 09400 Kuşadası/Aydın adresinde bize ulaşın. +90 544 157 15 49 numaralı telefondan arayın veya info@spin8studio.com adresine e-posta gönderin",
  keywords: [
    "spin studio",
    "indoor cycling",
    "kuşadası",
    "aydın",
    "türkiye",
    "contact",
    "fitness",
    "cycling club",
    "spin class",
    "kadınlar denizi",
    "iletişim",
    "spinning",
    "bisiklet kulübü",
    "fitness merkezi",
    "kuşadası spor",
  ],
  openGraph: {
    title: "Contact Us - Spin Studio | Indoor Cycling Club Kuşadası | İletişim",
    description:
      "Get in touch with Spin Studio indoor cycling club in Kuşadası, Aydın. Contact us for more information about our spin classes. | Kuşadası, Aydın'daki Spin Studio Indoor Cycling Club ile iletişime geçin. Spinning derslerimiz hakkında daha fazla bilgi için bize ulaşın.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["tr_TR"],
    siteName: "Spin Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us - Spin Studio | Indoor Cycling Club Kuşadası",
    description:
      "Get in touch with Spin Studio indoor cycling club in Kuşadası, Aydın.",
  },
  alternates: {
    canonical: "/contact",
    languages: {
      en: "/contact",
      tr: "/contact",
      "x-default": "/contact",
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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Structured data supporting both English and Turkish
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Spin Studio - Indoor Cycling Club",
    alternateName: "Spin Studio - Indoor Cycling Club",
    description:
      "Premium indoor cycling club in Kuşadası, Aydın, Türkiye | Kuşadası, Aydın, Türkiye'de premium Indoor Cycling Club",
    url: "https://spin8studio.com",
    telephone: "+905441571549",
    email: "info@spin8studio.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kadınlar Denizi, 14. Sk.",
      addressLocality: "Kuşadası",
      addressRegion: "Aydın",
      postalCode: "09400",
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "37.8575",
      longitude: "27.2583",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },
    sameAs: [
      "https://www.instagram.com/kusadasindoorcyclingclub/",
      "https://www.facebook.com/share/17iH2W9TgK/?mibextid=wwXIfr",
    ],
    // Multi-language support
    inLanguage: ["en", "tr"],
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
