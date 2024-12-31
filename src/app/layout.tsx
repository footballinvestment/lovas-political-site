import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mindenki Magyarországa Néppárt",
  description: "Modern megoldások, átlátható kormányzás, fenntartható fejlődés",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-white transition-colors duration-300 dark:bg-[#1C1C1C]`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
