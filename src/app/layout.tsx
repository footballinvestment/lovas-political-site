import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/context/ThemeContext";
import MainLayout from "@/components/layout/MainLayout";
import { PersonStructuredData, OrganizationStructuredData } from "@/components/seo/StructuredData";
import GlobalErrorBoundary from "@/components/error/GlobalErrorBoundary";
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider";

// Optimized font loading with preload and variable font
const inter = Inter({ 
  subsets: ["latin", "latin-ext"], // Added latin-ext for Hungarian characters
  display: "swap", // Improve perceived performance
  fallback: ["system-ui", "arial"], // Fallback fonts
  adjustFontFallback: true, // Adjust fallback metrics
  variable: "--font-inter", // CSS variable for the font
  weight: ["400", "500", "600", "700"], // Specify weights to optimize loading
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://lovaszoltan.hu";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Lovas Zoltán György | Mindenki Magyarországa Néppárt",
    template: "%s | Lovas Zoltán György",
  },
  description: "Lovas Zoltán György hivatalos weboldala. Mindenki Magyarországa Néppárt - Modern megoldások egy igazságosabb, élhetőbb Magyarországért.",
  keywords: ["Lovas Zoltán György", "Mindenki Magyarországa Néppárt", "politika", "Magyarország", "választás", "program"],
  authors: [{ name: "Lovas Zoltán György" }],
  creator: "Lovas Zoltán György",
  publisher: "Mindenki Magyarországa Néppárt",
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: "website",
    locale: "hu_HU",
    url: baseUrl,
    siteName: "Lovas Zoltán György",
    title: "Lovas Zoltán György | Mindenki Magyarországa Néppárt",
    description: "Modern megoldások egy igazságosabb, élhetőbb Magyarországért.",
    images: [
      {
        url: "/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Lovas Zoltán György",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lovas Zoltán György | Mindenki Magyarországa Néppárt",
    description: "Modern megoldások egy igazságosabb, élhetőbb Magyarországért.",
    images: ["/images/og-default.jpg"],
    creator: "@lovaszoltan",
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
    google: process.env.GOOGLE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lovas Zoltán György" />
        <link rel="apple-touch-icon" href="/images/icon-192.png" />
        <PersonStructuredData />
        <OrganizationStructuredData />
      </head>
      <body className={`${inter.className} dark:bg-gray-900`}>
        <ServiceWorkerProvider>
          <GlobalErrorBoundary>
            <AuthProvider>
              <ThemeProvider>
                <MainLayout>{children}</MainLayout>
              </ThemeProvider>
            </AuthProvider>
          </GlobalErrorBoundary>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
