import HeroSlider from "@/components/slider/HeroSlider";
import ClientPage from "@/components/sections/ClientPage";
import { Slide, SlideType } from "@prisma/client";

export const metadata = {
  title: "Kezdőlap - Lovas Zoltán György",
  description:
    "Mindenki Magyarországa Néppárt - Lovas Zoltán György hivatalos weboldala",
};

const testSlides: Slide[] = [
  {
    id: "1",
    type: SlideType.VIDEO,
    title: "Teszt Videó",
    subtitle: "Ez egy teszt videó slide",
    mediaUrl: "/uploads/escobarhun_cut.mp4",
    autoPlay: true,
    isLoop: true,
    isMuted: true,
    isActive: true,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    gradientFrom: "",
    gradientTo: "",
    ctaText: "",
    ctaLink: "",
    videoType: "mp4",
  },
];

export default function Home() {
  return <ClientPage slides={testSlides} />;
}
