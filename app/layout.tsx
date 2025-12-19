import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spin Studio - Indoor Cycling Club",
  description:
    "Spin Studio - Premium indoor cycling club coming soon to Kuşadası, Aydın, Türkiye. Join us for energizing spin classes in a state-of-the-art facility designed to elevate your fitness journey.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const html = document.documentElement;
                let isDark = false;
                
                if (theme === 'dark') {
                  isDark = true;
                } else if (theme === 'system') {
                  isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                }
                
                if (isDark) {
                  html.classList.add('dark');
                  html.setAttribute('data-theme', 'dark');
                } else {
                  html.classList.remove('dark');
                  html.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Header />
              {children}
              <Footer />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
