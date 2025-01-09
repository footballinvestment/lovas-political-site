import { PrismaClient, SlideType } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateToSlides() {
  try {
    // 1. Program adatok migrálása
    const programs = await prisma.program.findMany();
    console.log(`Found ${programs.length} programs to migrate`);

    // SavedTheme-ek betöltése a színekhez
    const themes = await prisma.savedTheme.findMany();
    console.log(`Found ${themes.length} themes for colors`);

    // Programok átalakítása slide-okká
    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];
      // Válasszunk egy random témát a színekhez
      const theme = themes[Math.floor(Math.random() * themes.length)];

      await prisma.slide.create({
        data: {
          type: SlideType.GRADIENT,
          title: program.title,
          subtitle: program.description,
          order: i,
          isActive: true,
          gradientFrom: theme.fromColor,
          gradientTo: theme.toColor,
          ctaText: "Program részletei",
          ctaLink: `/program#${program.category.toLowerCase()}`,
        },
      });
    }

    // 2. Hozzunk létre egy alapértelmezett slide-ot a fő üzenettel
    const mainTheme =
      themes.find((t) => t.name === "Kék-Zöld Modern") || themes[0];
    await prisma.slide.create({
      data: {
        type: SlideType.GRADIENT,
        title: "Építsük együtt a jövő Magyarországát",
        subtitle:
          "Modern megoldások, átlátható kormányzás, fenntartható fejlődés",
        order: -1, // Első helyre kerüljön
        isActive: true,
        gradientFrom: mainTheme.fromColor,
        gradientTo: mainTheme.toColor,
        ctaText: "Programom megismerése",
        ctaLink: "/program",
      },
    });

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToSlides();
