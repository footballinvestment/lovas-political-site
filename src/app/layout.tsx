import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/context/ThemeContext";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mindenki Magyarországa Néppárt",
  description: "Mindenki Magyarországa Néppárt hivatalos weboldala",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <Navigation />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
