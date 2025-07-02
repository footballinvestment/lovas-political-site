// src/app/hirek/page.tsx
import HirekSzekcio from "@/components/HirekSzekcio";
import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
  "Hírek",
  "Legfrissebb hírek és bejelentések Lovas Zoltán Györgytől és a Mindenki Magyarországa Néppárttól.",
  "/hirek",
  {
    keywords: "hírek, bejelentések, Lovas Zoltán György, politikai hírek, Mindenki Magyarországa Néppárt",
    image: "/images/og-news.jpg",
  }
);

export default function HirekOldal() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="relative bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] pt-20">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
        <HirekSzekcio />
      </div>
    </main>
  );
}
